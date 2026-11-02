local au = vim.api.nvim_create_autocmd

-- ── Reload files changed on disk (AI agents, git, other editors) ──
-- checktime compares each open buffer with its file on disk. Run it when focus
-- or the buffer changes, and every 2 s. Never while typing a command, so it
-- does not interrupt the cmdline.
local function safe_checktime()
  if vim.fn.mode() == "c" or vim.fn.getcmdwintype() ~= "" then return end
  vim.cmd("checktime")
end
au({ "FocusGained", "BufEnter", "CursorHold", "TermLeave" }, { callback = safe_checktime })

local reload_timer = vim.uv.new_timer()
if reload_timer then
  reload_timer:start(2000, 2000, function()
    vim.schedule(function()
      if vim.fn.mode():match("^[ic]") then return end -- skip insert and cmdline
      safe_checktime()
    end)
  end)
end

-- While a diffview tab is open, refresh its file list every 3 s (and on focus)
-- so files changed by an AI agent show up. Only runs when diffview is loaded.
local function diffview_refresh()
  if vim.fn.mode():match("^[ic]") or vim.fn.getcmdwintype() ~= "" then return end
  if not package.loaded["diffview.lib"] then return end
  local ok, view = pcall(function() return require("diffview.lib").get_current_view() end)
  if ok and view then pcall(vim.cmd, "DiffviewRefresh") end
end
au("FocusGained", { callback = diffview_refresh })

local diff_timer = vim.uv.new_timer()
if diff_timer then
  diff_timer:start(3000, 3000, function()
    vim.schedule(diffview_refresh)
  end)
end

au("FileChangedShellPost", {
  callback = function() vim.notify("File changed on disk — reloaded", vim.log.levels.WARN) end,
})

-- ── Sessions (persistence.nvim): saved in stdpath("state"), not in projects ──
-- A bare `nvim` restores the session for this folder. `nvim file` or piped
-- input does not.
local stdin_read = false
au("StdinReadPre", { callback = function() stdin_read = true end })
au("VimEnter", {
  nested = true,
  callback = function()
    if vim.fn.argc() == 0 and not stdin_read then require("persistence").load() end
  end,
})
-- Save as you work, so a tmux or reboot kill keeps the session
au({ "BufWritePost", "FocusLost" }, {
  callback = function() pcall(require("persistence").save) end,
})

-- Markdown buffers: spell check (wrap is on globally)
au("FileType", {
  pattern = "markdown",
  callback = function() vim.opt_local.spell = true end,
})

-- Any diff window (diffview, `nvim -d`, :diffsplit): no soft wrap, so both
-- sides stay the same height and scroll together
au("OptionSet", {
  pattern = "diff",
  callback = function()
    if vim.v.option_new then vim.wo.wrap = false end
  end,
})

-- Flash the yanked text so it's clear what was copied
au("TextYankPost", {
  callback = function() vim.hl.on_yank({ timeout = 250 }) end,
})

-- LSP keys, only in buffers with a language server attached.
-- Built-in defaults also work: K hover, grn rename, gra code action,
-- grr references, gri implementation, gO symbols.
au("LspAttach", {
  callback = function(ev)
    local map = function(lhs, rhs, desc)
      vim.keymap.set("n", lhs, rhs, { buffer = ev.buf, desc = desc })
    end
    map("gd", vim.lsp.buf.definition, "Go to definition")
    map("gD", vim.lsp.buf.declaration, "Go to declaration")
    map("<leader>cr", vim.lsp.buf.rename, "Rename symbol")
    map("<leader>ca", vim.lsp.buf.code_action, "Code action")
    map("<leader>fs", "<cmd>Telescope lsp_document_symbols<cr>", "Find symbol in file")
  end,
})
