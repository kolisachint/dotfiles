-- Tabline: one label per tab, filename only, active tab highlighted.
-- Visible only when 2+ tabs exist (opt.showtabline = 1 in options.lua).
-- Active/inactive colors come from the colorscheme (TabLineSel/TabLine),
-- so they follow Catppuccin Latte/Mocha. Tab number is text too, so the
-- active tab isn't carried by color alone.
local M = {}

function M.setup()
  vim.o.tabline = "%!v:lua.require('config.tabline').render()"
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
