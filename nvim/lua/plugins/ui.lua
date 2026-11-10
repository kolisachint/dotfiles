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
        -- WCAG AAA (>= 7:1 on every surface): same hues, OKLCH lightness
        -- nudges. Generated like rex/themes/make_aaa.py; text >= 10:1.
        color_overrides = {
          latte = {
            rosewater = "#6c2517", flamingo = "#751822", pink = "#74015f",
            mauve = "#5407a0", red = "#7e011d", maroon = "#7c091e",
            peach = "#6d2500", yellow = "#583404", green = "#0f4601",
            teal = "#024347", sky = "#02415c", sapphire = "#02434e",
            blue = "#033394", lavender = "#292b9b", text = "#21223a",
            subtext1 = "#383b51", subtext0 = "#393b4f",
            overlay2 = "#393b4d", overlay1 = "#393b4b",
            overlay0 = "#383c49",
          },
          mocha = {
            mauve = "#d6b5fe", red = "#feacc1", maroon = "#fbaeba",
            sapphire = "#7acef3", blue = "#a1c5fe", lavender = "#b5bfff",
            text = "#dde5ff", subtext0 = "#bbc2dd", overlay2 = "#bbc2dc",
            overlay1 = "#bcc2db", overlay0 = "#bdc2da",
          },
        },
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
