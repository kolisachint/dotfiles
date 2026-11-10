-- Theme, statusline, file explorers
return {
  { "nvim-tree/nvim-web-devicons", lazy = true },

  -- Catppuccin Latte (day) / Mocha (night): follows macOS appearance.
  -- apply_system_theme re-checks on FocusGained and every 60s (same as hoocode).
  {
    "catppuccin/nvim",
    name = "catppuccin",
    lazy = false,
    priority = 1000,
    config = function()
      require("catppuccin").setup({
        flavour = "auto",
        background = { light = "latte", dark = "mocha" },
        integrations = {
          blink_cmp = true,
          gitsigns = true,
          diffview = true,
          neogit = true,
          mason = true,
          nvimtree = true,
          telescope = { enabled = true },
          which_key = true,
          native_lsp = { enabled = true },
          render_markdown = true,
          snacks = { enabled = true },
        },
      })
      local function apply_system_theme(force)
        local out = vim.fn.system("defaults read -g AppleInterfaceStyle 2>/dev/null")
        local bg = out:match("Dark") and "dark" or "light"
        -- Only repaint on an actual change (avoids flicker on every poll)
        if force ~= true and vim.o.background == bg then return end
        vim.o.background = bg
        vim.cmd("colorscheme catppuccin")
      end
      apply_system_theme(true)
      -- Re-check when Neovim regains focus and every 60s (same as hoocode)
      vim.api.nvim_create_autocmd("FocusGained", { callback = function() apply_system_theme() end })
      local timer = vim.uv.new_timer()
      if timer then
        timer:start(60000, 60000, vim.schedule_wrap(function() apply_system_theme() end))
      end
    end,
  },

  -- VSCode-like statusline
  {
    "nvim-lualine/lualine.nvim",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    opts = {
      options = { theme = "auto" }, -- follows the active catppuccin flavour
      sections = {
        -- Macro recording shows here (showmode is off to save a row)
        lualine_x = {
          {
            function() return "REC @" .. vim.fn.reg_recording() end,
            cond = function() return vim.fn.reg_recording() ~= "" end,
          },
          "encoding",
          "fileformat",
          "filetype",
        },
        -- [read] error counts as "E:2 W:1", not just colored icons
        lualine_b = {
          "branch",
          "diff",
          { "diagnostics", symbols = { error = "E:", warn = "W:", info = "I:", hint = "H:" } },
        },
      },
    },
  },

  -- File tree (left side, like Zed/VSCode)
  {
    "nvim-tree/nvim-tree.lua",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    config = function()
      require("nvim-tree").setup({
        view = { side = "left", width = 30, preserve_window_proportions = true },
        renderer = {
          highlight_git = true,
          icons = { show = { git = true, file = true, folder = true } },
        },
        actions = { open_file = { quit_on_open = false } },
        update_focused_file = { enable = true },
        git = { enable = true },
        -- oil.nvim handles `nvim <dir>`; nvim-tree must not take over folders
        disable_netrw = false,
        hijack_netrw = false,
        hijack_directories = { enable = false },
      })
    end,
  },

  -- oil.nvim: press "-" to edit the current folder like a text buffer
  -- (rename = edit the line, delete = dd, create = type a new line, :w applies)
  {
    "stevearc/oil.nvim",
    lazy = false,
    dependencies = { "nvim-tree/nvim-web-devicons" },
    keys = { { "-", "<cmd>Oil<cr>", desc = "Edit parent folder (oil)" } },
    opts = {
      default_file_explorer = true, -- `nvim <dir>` opens oil
      view_options = { show_hidden = true },
      float = { border = "rounded" },
    },
  },
}
