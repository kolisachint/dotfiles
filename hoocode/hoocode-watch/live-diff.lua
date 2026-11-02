-- hoocode-watch live git diff viewer (nvim --clean -u this file)
-- Shows status + unstaged + staged diff, refreshes every 1s.
-- q = hold (pause), r = resume. :q quits -> outer loop auto-resumes after 60s idle.

local repo = vim.env.HOOCODE_WATCH_REPO
if not repo or repo == "" then repo = vim.fn.getcwd() end

-- minimal, fast, light-theme friendly UI
vim.opt.swapfile = false
vim.opt.backup = false
vim.opt.writebackup = false
vim.opt.undofile = false
vim.opt.number = true
vim.opt.relativenumber = false
vim.opt.wrap = false
vim.opt.scrolloff = 3
vim.opt.sidescrolloff = 5
vim.opt.termguicolors = true
vim.opt.background = "light"
vim.opt.mouse = "a"
vim.opt.showmode = false
vim.opt.laststatus = 2
pcall(vim.cmd, "colorscheme catppuccin-latte")
if vim.g.colors_name == nil then pcall(vim.cmd, "colorscheme lunaperche") end
if vim.g.colors_name == nil then pcall(vim.cmd, "colorscheme habamax") end

local buf = vim.api.nvim_create_buf(false, true) -- scratch, no file
vim.api.nvim_set_current_buf(buf)
vim.bo[buf].buftype = "nofile"
vim.bo[buf].bufhidden = "hide"
vim.bo[buf].swapfile = false
vim.bo[buf].filetype = "diff"
vim.bo[buf].modifiable = false

local held = false
local last_input = vim.fn.localtime() -- secs; refreshed on user activity
local last_lines_key = nil

local function mark_active()
  last_input = vim.fn.localtime()
end

local function run_git(args)
  local out = vim.fn.systemlist("git -C " .. vim.fn.shellescape(repo) .. " " .. args)
  if vim.v.shell_error ~= 0 and #out == 0 then return nil end
  return out
end

local function build_lines()
  local L = {}
  local now = vim.fn.strftime("%H:%M:%S")
  local branch = "(no repo)"
  local b = run_git("branch --show-current")
  if b and b[1] and b[1] ~= "" then branch = b[1] end
  local state = held and "HELD (r = resume, auto-resumes after 60s idle)" or "LIVE - updates every 1s"
  L[#L + 1] = ("= %s | %s | %s | %s  [q hold] [r resume] [:q interrupt] ="):format(
    state, repo, branch, now)
  L[#L + 1] = ""
  L[#L + 1] = "--- status ---"
  local st = run_git("status --short --branch")
  if not st then
    L[#L + 1] = "(git error: not a repo or git failed)"
    return L
  end
  if #st == 0 then L[#L + 1] = "(clean)" else vim.list_extend(L, st) end
  L[#L + 1] = ""
  L[#L + 1] = "--- diff --stat ---"
  local stat = run_git("diff --stat")
  if stat and #stat > 0 then vim.list_extend(L, stat)
  else L[#L + 1] = "(no unstaged changes)" end
  L[#L + 1] = ""
  L[#L + 1] = "--- unstaged diff ---"
  local d = run_git("diff --no-color --unified=3")
  if d and #d > 0 then vim.list_extend(L, d)
  else L[#L + 1] = "(none)" end
  L[#L + 1] = ""
  L[#L + 1] = "--- staged diff ---"
  local s = run_git("diff --cached --no-color --unified=3")
  if s and #s > 0 then vim.list_extend(L, s)
  else L[#L + 1] = "(none)" end
  return L
end

local function refresh()
  if held then return end
  if vim.api.nvim_get_current_buf() ~= buf then
    -- user navigated away inside nvim: return after 60s idle
    if vim.fn.localtime() - last_input >= 60 then
      pcall(vim.api.nvim_set_current_buf, buf)
      mark_active()
    else
      return
    end
  end
  local lines = build_lines()
  local key = table.concat(lines, "\n")
  if key == last_lines_key then return end
  last_lines_key = key
  local view = vim.fn.winsaveview()
  vim.bo[buf].modifiable = true
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
  vim.bo[buf].modifiable = false
  pcall(vim.fn.winrestview, view)
  vim.opt.statusline = (" %s  %s  %s "):format(
    held and "HELD" or "LIVE-DIFF", repo, vim.fn.strftime("%H:%M:%S"))
end

-- user activity tracking
local grp = vim.api.nvim_create_augroup("HoocodeWatch", { clear = true })
vim.api.nvim_create_autocmd(
  { "CursorMoved", "CursorMovedI", "InsertCharPre", "WinScrolled", "CmdlineEnter" },
  { group = grp, callback = mark_active }
)
vim.api.nvim_create_autocmd("FocusGained", { group = grp, callback = function()
  mark_active(); refresh()
end })

-- hold / resume keys (buffer local)
vim.keymap.set("n", "q", function()
  held = true
  mark_active()
  vim.opt.statusline = " HELD - press r to resume (auto-resumes after 60s idle) "
  print("HELD - press r to resume, auto-resumes after 60s idle")
end, { buffer = buf, nowait = true, desc = "hold live diff" })
vim.keymap.set("n", "r", function()
  held = false
  last_lines_key = nil
  mark_active()
  refresh()
  print("LIVE - resuming")
end, { buffer = buf, nowait = true, desc = "resume live diff" })

-- 1s refresh + 60s idle auto-resume from HELD
vim.fn.timer_start(1000, function()
  if held and vim.fn.localtime() - last_input >= 60 then
    held = false
    last_lines_key = nil
    print("auto-resuming live diff after 60s idle")
  end
  refresh()
end, { ["repeat"] = -1 })

refresh()
