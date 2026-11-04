-- Editor options. Readability tweaks for low vision are marked [read].
local opt = vim.opt

opt.number = true
opt.relativenumber = false
opt.signcolumn = "yes"
opt.cursorline = true
opt.cursorlineopt = "both" -- [read] highlight the line AND its number
opt.termguicolors = true
opt.background = "dark" -- overridden at startup by the system-theme check
opt.scrolloff = 8
opt.sidescrolloff = 8
opt.tabstop = 2
opt.shiftwidth = 2
opt.expandtab = true
opt.smartindent = true
opt.ignorecase = true
opt.smartcase = true
opt.updatetime = 250
opt.timeoutlen = 400 -- which-key popup appears sooner
opt.splitright = true -- new splits go right (editor side)
opt.splitbelow = true
opt.clipboard = "unnamedplus"
opt.conceallevel = 2 -- needed for inline markdown rendering
opt.concealcursor = "nc"
opt.undofile = true -- undo history survives closing the file
opt.confirm = true -- ask to save instead of failing on :q
opt.mouse = "a" -- mouse wheel scrolls the diff panes
opt.inccommand = "split" -- live preview of :s substitutions

-- Reload files that an AI agent or another program changed on disk
opt.autoread = true

-- Free screen rows: tab bar only when 2+ tabs exist (diffview, :tabedit),
-- no command line unless typing : or /, no mode text (lualine shows it).
opt.showtabline = 1
opt.cmdheight = 0
opt.showmode = false
-- Fewer "Press ENTER" prompts and extra messages
opt.shortmess:append("sWcCI")
-- Message UI: ui2 replaces the Press-ENTER layer (cmdheight=0 works best with it).
-- This install has vim._core.ui2 (no vim._extui). Must run after cmdheight is set.
pcall(function() require("vim._core.ui2").enable({}) end)

-- Session save/restore (persistence.nvim): skip blank windows and terminals
opt.sessionoptions:remove({ "blank", "terminal" })

-- [read] Soft wrap long lines at word boundaries, keep indent on wrap
opt.wrap = true
opt.linebreak = true
opt.breakindent = true
opt.showbreak = "↪ "

-- [read] Diff mode: lines stay aligned, unchanged runs keep 5 lines of
-- context, and deleted lines get a hatched fill (not color alone)
opt.diffopt = { "internal", "filler", "closeoff", "context:5", "algorithm:histogram", "indent-heuristic", "linematch:60" }
opt.fillchars:append({ diff = "╱" })

-- [read] Rounded borders on every floating window (hover, popups)
opt.winborder = "rounded"

-- [read] Diagnostics never rely on color alone:
--   letter in the sign column, "ERROR:" style label in the text,
--   full message on its own line under the cursor line.
local sev = vim.diagnostic.severity
local label = { [sev.ERROR] = "ERROR", [sev.WARN] = "WARN", [sev.INFO] = "INFO", [sev.HINT] = "HINT" }
vim.diagnostic.config({
  severity_sort = true,
  signs = {
    text = { [sev.ERROR] = "E", [sev.WARN] = "W", [sev.INFO] = "I", [sev.HINT] = "H" },
  },
  virtual_text = {
    spacing = 2,
    prefix = "●",
    format = function(d) return label[d.severity] .. ": " .. d.message end,
  },
  -- Full message on separate lines, only for the line the cursor is on
  virtual_lines = { current_line = true },
  float = { border = "rounded", source = true, header = "" },
  underline = true,
  update_in_insert = false,
})
