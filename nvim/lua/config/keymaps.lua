-- Keymaps (VSCode/Zed muscle memory). Plugin keys live in their plugin file.
-- Press Space and wait: which-key lists everything.
local map = vim.keymap.set

-- Tree
map("n", "<C-n>", "<cmd>NvimTreeToggle<cr>", { desc = "Toggle file tree" })
map("n", "<leader>t", "<cmd>NvimTreeToggle<cr>", { desc = "Show/hide file tree" })
map("n", "<leader>e", "<cmd>NvimTreeFocus<cr>", { desc = "Focus file tree" })

-- Layout (dictionary verbs via Space leader — same letters as herdr/rex
-- prefix keys; see KEYBINDINGS.md. nvim tabpages are Views, not multiplexer
-- tabs, so tab hop stays on ]t/[t and Tab/S-Tab above.)
map("n", "<leader>b", "<cmd>NvimTreeToggle<cr>", { desc = "Toggle file tree (= prefix b sidebar)" })
map("n", "<leader>v", "<cmd>vsplit<cr>", { desc = "Split right (= prefix v)" })
map("n", "<leader>-", "<cmd>split<cr>", { desc = "Split down (= prefix -)" })
-- Zoom toggle (= prefix z). Saves the tab layout, maximizes, restores back.
map("n", "<leader>z", function()
  if vim.t.zoomed then
    vim.cmd(vim.t.zoom_restore or "")
    vim.t.zoomed = false
  else
    vim.t.zoom_restore = vim.fn.winrestcmd()
    vim.cmd("resize | vertical resize")
    vim.t.zoomed = true
  end
end, { desc = "Zoom window (toggle)" })

-- Saving
map({ "n", "i", "v" }, "<C-s>", "<cmd>w<cr><esc>", { desc = "Save" })

-- Window nav (editor on right, tree on left)
-- Bare Ctrl-h/j/k/l: safe — rex/tmux only act on these AFTER their prefix.
map("n", "<C-h>", "<C-w>h", { desc = "Go left" })
map("n", "<C-j>", "<C-w>j", { desc = "Go down" })
map("n", "<C-k>", "<C-w>k", { desc = "Go up" })
map("n", "<C-l>", "<C-w>l", { desc = "Go right" })

-- Wrapped lines: move by screen line, not file line
map({ "n", "x" }, "j", "v:count == 0 ? 'gj' : 'j'", { expr = true, silent = true })
map({ "n", "x" }, "k", "v:count == 0 ? 'gk' : 'k'", { expr = true, silent = true })

-- Clear search highlight
map("n", "<Esc>", "<cmd>nohlsearch<cr>", { desc = "Clear search highlight" })

-- Tabs (bar appears only with 2+ tabs; labels in config/tabline.lua)
-- gt / gT also work natively. Numbers match the tabline labels.
-- <Tab> / <S-Tab> cycle tabs (VSCode/Zed muscle memory). <Tab> is the
-- same keycode as <C-I> (jump forward), so with a single tab it keeps
-- the jump behaviour instead of doing nothing.
map("n", "<Tab>", function()
  if #vim.api.nvim_list_tabpages() > 1 then
    vim.cmd.tabnext()
  else
    vim.cmd("normal! \15") -- <C-I>: jump forward (normal! skips this mapping)
  end
end, { desc = "Next tab" })
map("n", "<S-Tab>", "<cmd>tabprevious<cr>", { desc = "Previous tab" })
map("n", "]t", "<cmd>tabnext<cr>", { desc = "Next tab" })
map("n", "[t", "<cmd>tabprevious<cr>", { desc = "Previous tab" })
map("n", "<leader>te", "<cmd>tabedit<cr>", { desc = "New tab" })
map("n", "<leader>tx", "<cmd>tabclose<cr>", { desc = "Close tab" })
map("n", "<leader>to", "<cmd>tabonly<cr>", { desc = "Close other tabs" })
for i = 1, 9 do
  map("n", "<leader>t" .. i, i .. "gt", { desc = "Go to tab " .. i })
end

-- Markdown
map("n", "<leader>mp", "<cmd>MarkdownPreviewToggle<cr>", { desc = "Browser markdown preview" })
map("n", "<leader>mm", "<cmd>RenderMarkdown toggle<cr>", { desc = "Toggle inline markdown render" })

-- Diagnostics
map("n", "<leader>cd", vim.diagnostic.open_float, { desc = "Show error under cursor" })
