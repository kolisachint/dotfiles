-- ~/.config/nvim/init.lua
-- Zed / VSCode-like layout: tree on left, editor on right.
-- Everything lives in lua/:
--   config/options.lua   editor options + readability
--   config/keymaps.lua   VSCode/Zed muscle-memory keys
--   config/autocmds.lua  filetype tweaks, session restore (no tree auto-open)
--   config/media.lua     open / play images, video, audio
--   config/tabline.lua   filename-only tab bar (shows with 2+ tabs)
--   config/lazy.lua        plugin manager bootstrap
--   plugins/*.lua        one file per plugin group
-- Previous single-file config: backups/init.lua.*

-- Leader first (plugins read it at load time)
vim.g.mapleader = ";"
vim.g.maplocalleader = ";"

require("config.options")
require("config.lazy")
require("config.keymaps")
require("config.autocmds")
require("config.tabline").setup()
require("config.media").setup()
