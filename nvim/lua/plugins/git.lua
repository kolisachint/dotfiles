-- Git inside Neovim. Press ;g and wait: which-key lists all git keys.
--
--   <leader>gg  Neogit: status screen (stage, commit, push, pull, log)
--   <leader>gd  Diff of every changed file, side by side (diffview)
--   <leader>gv  Show / hide the diff view (toggle)
--   <leader>gD  Diff against main branch (what a PR would show)
--   <leader>gh  History of this file      <leader>gH  history of the repo
--   <leader>gq  Close the diff / history tab
--   <leader>gs  Search changed files (Telescope)
--   ]h / [h     Next / previous change in this file
--   <leader>gp  Preview change    <leader>ga  stage change    <leader>gr  undo change
--   <leader>gb  Blame line        <leader>gl  toggle blame on every line
--
-- In the Neogit screen:  s stage, u unstage, x discard, Tab open/close,
-- c c commit, P p push, F p pull, l l log, ? all keys, q close.
-- In diffview:  Tab / Shift-Tab next/prev file, - stage/unstage file,
-- g? all keys.
return {
  -- Change marks in the left margin (+ ~ _) and per-change actions
  {
    "lewis6991/gitsigns.nvim",
    event = { "BufReadPre", "BufNewFile" },
    opts = {
      signs = {
        add = { text = "+" },
        change = { text = "~" },
        delete = { text = "_" },
        topdelete = { text = "‾" },
        changedelete = { text = "~" },
      },
      current_line_blame_opts = { delay = 300 },
      on_attach = function(buf)
        local gs = require("gitsigns")
        local map = function(mode, l, r, d) vim.keymap.set(mode, l, r, { buffer = buf, desc = d }) end
        map("n", "]h", function() gs.nav_hunk("next") end, "Next git change")
        map("n", "[h", function() gs.nav_hunk("prev") end, "Previous git change")
        -- ]c / [c: same as ]h / [h. In diff mode, use Vim's native ]c / [c.
        map("n", "]c", function()
          if vim.wo.diff then vim.cmd.normal({ "]c", bang = true }) else gs.nav_hunk("next") end
        end, "Next git change")
        map("n", "[c", function()
          if vim.wo.diff then vim.cmd.normal({ "[c", bang = true }) else gs.nav_hunk("prev") end
        end, "Previous git change")
        map("n", "<leader>gp", gs.preview_hunk, "Preview git change")
        map("n", "<leader>ga", gs.stage_hunk, "Stage / unstage change")
        map("v", "<leader>ga", function() gs.stage_hunk({ vim.fn.line("."), vim.fn.line("v") }) end, "Stage selected lines")
        map("n", "<leader>gr", gs.reset_hunk, "Undo git change")
        map("v", "<leader>gr", function() gs.reset_hunk({ vim.fn.line("."), vim.fn.line("v") }) end, "Undo selected lines")
        map("n", "<leader>gA", gs.stage_buffer, "Stage whole file")
        map("n", "<leader>gb", function() gs.blame_line({ full = true }) end, "Blame line")
        map("n", "<leader>gl", gs.toggle_current_line_blame, "Toggle blame on every line")
      end,
    },
  },

  -- Side-by-side diffs and file / branch history
  {
    "sindrets/diffview.nvim",
    cmd = { "DiffviewOpen", "DiffviewClose", "DiffviewFileHistory" },
    keys = {
      { "<leader>gd", "<cmd>DiffviewOpen<cr>", desc = "Diff all changes" },
      {
        "<leader>gv",
        function()
          local lib = require("diffview.lib")
          if lib.get_current_view() then
            vim.cmd("DiffviewClose")
          else
            vim.cmd("DiffviewOpen")
          end
        end,
        desc = "Git diff view (toggle)",
      },
      {
        "<leader>gD",
        function()
          local main = vim.fn.systemlist("git rev-parse --verify --quiet main")[1] and "main" or "master"
          vim.cmd("DiffviewOpen " .. main .. "...HEAD")
        end,
        desc = "Diff against main branch",
      },
      { "<leader>gh", "<cmd>DiffviewFileHistory %<cr>", desc = "History of this file" },
      { "<leader>gH", "<cmd>DiffviewFileHistory<cr>", desc = "History of the repo" },
      { "<leader>gq", "<cmd>DiffviewClose<cr>", desc = "Close diff view" },
    },
    opts = {
      enhanced_diff_hl = true,
      view = {
        default = { layout = "diff2_horizontal" }, -- old left, new right
        file_history = { layout = "diff2_horizontal" },
        merge_tool = { layout = "diff3_horizontal" },
      },
      file_panel = {
        listing_style = "tree",
        win_config = { position = "right", width = 35 }, -- changed files on the right
      },
      hooks = {
        -- Both sides scroll together (scrollbind + cursorbind, mouse wheel too).
        -- No soft wrap or folds, so the two panes stay the same height and line up.
        diff_buf_win_enter = function(_, winid)
          local wo = vim.wo[winid]
          wo.scrollbind = true
          wo.cursorbind = true
          wo.wrap = false
          wo.foldenable = false
        end,
      },
    },
  },

  -- Magit-style git screen
  {
    "NeogitOrg/neogit",
    cmd = "Neogit",
    dependencies = { "nvim-lua/plenary.nvim", "sindrets/diffview.nvim", "nvim-telescope/telescope.nvim" },
    keys = {
      { "<leader>gg", "<cmd>Neogit<cr>", desc = "Git status (Neogit)" },
      { "<leader>gc", "<cmd>Neogit commit<cr>", desc = "Commit" },
      { "<leader>gs", "<cmd>Telescope git_status<cr>", desc = "Search changed files" },
    },
    opts = {
      kind = "tab", -- full tab: more room, easier to read
      graph_style = "unicode",
      integrations = { diffview = true, telescope = true },
      -- [read] spell out signs so state isn't carried by color alone
      signs = { hunk = { "", "" }, item = { "▸", "▾" }, section = { "▸", "▾" } },
    },
  },
}
