-- Media: images show inside Neovim (snacks.image, see plugins/snacks.lua).
-- Video and audio open as an info page instead of binary garbage, and play
-- with ffplay (Homebrew ffmpeg) or the default macOS app (QuickTime).
--
-- Keys work on: the current media buffer, the file under the cursor in
-- nvim-tree or oil, or a path / markdown link under the cursor.
--   <leader>oo  open with default macOS app
--   <leader>op  play with ffplay (video: own window, audio: background)
--   <leader>os  stop ffplay playback
--   <leader>of  reveal in Finder
-- On a video/audio info page: p play, o open in app, s stop, q close.
local M = {}

M.video = { "mp4", "mkv", "mov", "webm", "avi", "m4v", "mpg", "mpeg", "wmv", "flv" }
M.audio = { "mp3", "wav", "flac", "m4a", "aac", "ogg", "opus", "aiff", "aif", "wma" }

local function set_of(list)
  local s = {}
  for _, e in ipairs(list) do s[e] = true end
  return s
end
local VIDEO, AUDIO = set_of(M.video), set_of(M.audio)

local function ext(path) return (path:match("%.([%w]+)$") or ""):lower() end

local player -- running ffplay job

--- The file the user means right now, as an absolute path (or nil).
function M.target()
  local ft = vim.bo.filetype
  if ft == "NvimTree" then
    local ok, api = pcall(require, "nvim-tree.api")
    local node = ok and api.tree.get_node_under_cursor()
    return node and node.absolute_path
  end
  if ft == "oil" then
    local oil = require("oil")
    local entry, dir = oil.get_cursor_entry(), oil.get_current_dir()
    return entry and dir and (dir .. entry.name)
  end
  local media = vim.b.media_path
  if media then return media end
  -- path or link under the cursor, relative to this file's folder
  local cfile = vim.fn.expand("<cfile>")
  if cfile ~= "" and not cfile:match("^%a+://") then
    local base = vim.fn.expand("%:p:h")
    local p = vim.fs.normalize(cfile:sub(1, 1) == "/" and cfile or (base .. "/" .. cfile))
    if vim.uv.fs_stat(p) then return p end
  end
  if cfile:match("^%a+://") then return cfile end -- URL
  local name = vim.api.nvim_buf_get_name(0)
  return name ~= "" and name or nil
end

local function need(path)
  if not path then vim.notify("No file under cursor", vim.log.levels.WARN) end
  return path
end

function M.open(path)
  path = need(path or M.target())
  if path then vim.ui.open(path) end
end

function M.reveal(path)
  path = need(path or M.target())
  if path then vim.system({ "open", "-R", path }) end
end

function M.stop()
  if player and not player:is_closing() then
    player:kill(15)
    vim.notify("Playback stopped")
  end
  player = nil
end

function M.play(path)
  path = need(path or M.target())
  if not path then return end
  if vim.fn.executable("ffplay") == 0 then
    vim.notify("ffplay not found, opening in default app", vim.log.levels.WARN)
    return M.open(path)
  end
  M.stop()
  local cmd = { "ffplay", "-autoexit", "-loglevel", "quiet" }
  if AUDIO[ext(path)] then
    vim.list_extend(cmd, { "-nodisp" }) -- no window, plays in background
  else
    vim.list_extend(cmd, { "-window_title", vim.fs.basename(path) })
  end
  table.insert(cmd, path)
  player = vim.system(cmd, {}, function() player = nil end)
  local how = AUDIO[ext(path)] and "  (stop: <leader>os)" or "  (in its window: space pause, q quit)"
  vim.notify("Playing " .. vim.fs.basename(path) .. how)
end

-- Info page for video/audio files: readable text instead of binary
local function info_page(ev)
  local path = vim.fs.normalize(vim.fn.fnamemodify(ev.match, ":p"))
  local kind = AUDIO[ext(path)] and "Audio" or "Video"
  local lines = {
    "  " .. kind .. ": " .. vim.fs.basename(path),
    "  Folder: " .. vim.fs.dirname(path),
    "",
    "  Keys:  p  play (ffplay)    o  open in app    s  stop    f  Finder    q  close",
    "",
  }
  if vim.fn.executable("ffprobe") == 1 then
    local r = vim.system({
      "ffprobe", "-v", "error", "-hide_banner",
      "-show_entries", "format=duration,size,bit_rate:stream=codec_type,codec_name,width,height,sample_rate,channels",
      "-of", "default=noprint_wrappers=0", path,
    }, { text = true }):wait()
    for l in (r.stdout or ""):gmatch("[^\n]+") do
      if not l:match("^%[") and not l:match("=N/A$") then table.insert(lines, "  " .. l) end
      if l == "[/STREAM]" then table.insert(lines, "") end
    end
  end
  local buf = ev.buf
  if vim.b[buf].media_path then return end -- already built
  vim.bo[buf].modifiable = true
  vim.bo[buf].buftype = "nofile"
  vim.bo[buf].swapfile = false
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
  vim.bo[buf].modifiable = false
  vim.bo[buf].filetype = "mediainfo"
  vim.b[buf].media_path = path
  local o = { buffer = buf, nowait = true }
  vim.keymap.set("n", "p", function() M.play(path) end, o)
  vim.keymap.set("n", "o", function() M.open(path) end, o)
  vim.keymap.set("n", "s", M.stop, o)
  vim.keymap.set("n", "f", function() M.reveal(path) end, o)
  vim.keymap.set("n", "q", "<cmd>bdelete<cr>", o)
end

function M.setup()
  local pats = {}
  for _, e in ipairs(vim.list_extend(vim.deepcopy(M.video), M.audio)) do
    table.insert(pats, "*." .. e)
    -- macOS matches patterns case-insensitively; add upper case elsewhere
    if vim.fn.has("mac") == 0 then table.insert(pats, "*." .. e:upper()) end
  end
  vim.api.nvim_create_autocmd("BufReadCmd", { pattern = pats, callback = info_page })
  vim.api.nvim_create_autocmd("VimLeavePre", { callback = M.stop })

  local map = vim.keymap.set
  map("n", "<leader>oo", function() M.open() end, { desc = "Open with default app" })
  map("n", "<leader>op", function() M.play() end, { desc = "Play media (ffplay)" })
  map("n", "<leader>os", M.stop, { desc = "Stop playback" })
  map("n", "<leader>of", function() M.reveal() end, { desc = "Reveal in Finder" })
  vim.api.nvim_create_user_command("Play", function(a) M.play(a.args ~= "" and vim.fn.expand(a.args) or nil) end,
    { nargs = "?", complete = "file", desc = "Play media with ffplay" })
  vim.api.nvim_create_user_command("Open", function(a) M.open(a.args ~= "" and vim.fn.expand(a.args) or nil) end,
    { nargs = "?", complete = "file", desc = "Open with default app" })
end

return M
