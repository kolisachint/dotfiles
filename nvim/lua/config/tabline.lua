-- Tabline: one label per tab, filename only, active tab highlighted.
-- Visible only when 2+ tabs exist (opt.showtabline = 1 in options.lua).
-- Colors are set explicitly from the Catppuccin palette (Latte/Mocha) so
-- the active tab is a solid blue pill, readable in both flavors -- the
-- stock TabLineSel wash is too low-contrast. Tab number is text too, so
-- the active tab isn't carried by color alone.
local M = {}

-- [read] Explicit tabline colors: re-applied after every :colorscheme
-- (colorschemes clear custom highlights), including the auto light/dark
-- switch in plugins/ui.lua which re-sets the colorscheme.
local function apply_colors()
  local ok, palettes = pcall(require, "catppuccin.palettes")
  local p
  if ok then
    p = palettes.get_palette()
  else -- fallback if catppuccin isn't loaded yet
    local dark = vim.o.background ~= "light"
    p = dark
      and { base = "#1e1e2e", mantle = "#181825", blue = "#89b4fa", subtext0 = "#a6adc8" }
      or { base = "#eff1f5", mantle = "#e6e9ef", blue = "#1e66f5", subtext0 = "#6c6f85" }
  end
  vim.api.nvim_set_hl(0, "TabLineSel", { fg = p.base, bg = p.blue, bold = true })
  vim.api.nvim_set_hl(0, "TabLine", { fg = p.subtext0, bg = p.mantle })
  vim.api.nvim_set_hl(0, "TabLineFill", { bg = p.base })
end

function M.setup()
  vim.o.tabline = "%!v:lua.require('config.tabline').render()"
  apply_colors()
  vim.api.nvim_create_autocmd("ColorScheme", {
    group = vim.api.nvim_create_augroup("TablineColors", { clear = true }),
    callback = apply_colors,
    desc = "Re-apply tabline colors after colorscheme change",
  })
end

local function icon_for(basename)
  local ok, devicons = pcall(require, "nvim-web-devicons")
  if not ok then return "" end
  local icon = devicons.get_icon(basename, vim.fn.fnamemodify(basename, ":e"), { default = false })
  return icon and (icon .. " ") or ""
end

local function label_for(buf)
  local name = vim.api.nvim_buf_get_name(buf)
  if name == "" then
    if vim.bo[buf].buftype == "terminal" then return "[Terminal]" end
    if vim.bo[buf].filetype == "oil" then return "[Oil]" end
    return "[No Name]"
  end
  return icon_for(vim.fn.fnamemodify(name, ":t")) .. vim.fn.fnamemodify(name, ":t")
end

function M.render()
  local parts = {}
  local current = vim.api.nvim_get_current_tabpage()
  for _, tab in ipairs(vim.api.nvim_list_tabpages()) do
    local nr = vim.api.nvim_tabpage_get_number(tab)
    local win = vim.api.nvim_tabpage_get_win(tab)
    local buf = vim.api.nvim_win_get_buf(win)
    local mod = vim.bo[buf].modified and " [+]" or ""
    local hl = tab == current and "%#TabLineSel#" or "%#TabLine#"
    parts[#parts + 1] = "%" .. nr .. "T" .. hl .. " " .. nr .. " " .. label_for(buf) .. mod .. " %#TabLineFill#"
  end
  return table.concat(parts) .. "%T%#TabLineFill#"
end

return M
