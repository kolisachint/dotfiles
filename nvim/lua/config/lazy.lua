-- Bootstrap lazy.nvim, then load every file in lua/plugins/
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.uv.fs_stat(lazypath) then
  vim.fn.system({
    "git", "clone", "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  spec = { { import = "plugins" } },
  install = { colorscheme = { "kanagawa-dragon", "catppuccin" } },
  ui = { border = "rounded" },
  change_detection = { notify = false },
  checker = { enabled = false },
  rocks = { enabled = false }, -- no luarocks needed; silences the health error
})
