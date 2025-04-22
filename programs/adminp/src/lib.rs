use anchor_lang::prelude::*;
use my_program::program::MyProgram; // your main program crate
use my_program::cpi::accounts::UpdateGameConfig as MyProgramUpdateGameConfig;
use my_program::cpi::update_game_config as my_program_update_game_config;
use my_program::states::GameConfig;

declare_id!("FM2zDi5UkY3UqbZoVVF62KRcj6udk8H2kK14iduevuF5"); // Admin program ID

#[program]
pub mod adminp {
    use super::*;

    pub fn call_update_game_config(
        ctx: Context<CallUpdateGameConfig>,
        new_min: u64,
        new_max: u64,
    ) -> Result<()> {
        let cpi_program = ctx.accounts.my_program_program.to_account_info();

        let cpi_accounts = MyProgramUpdateGameConfig {
            admin_signer: ctx.accounts.admin_signer.to_account_info(),
            config: ctx.accounts.config.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
            admin_program: ctx.accounts.admin_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        my_program_update_game_config(cpi_ctx, new_min, new_max)
    }
}

#[derive(Accounts)]
pub struct CallUpdateGameConfig<'info> {
    pub admin_signer: Signer<'info>, // The person paying

    #[account(mut)]
    pub config: Account<'info, GameConfig>,

    /// CHECK: PDA verified in main program
    pub authority: UncheckedAccount<'info>,

    /// CHECK: Should be your own program’s ID (this program)
    pub admin_program: UncheckedAccount<'info>,

    /// CHECK: Main Game Program ID
    pub my_program_program: Program<'info, MyProgram>,

    pub system_program: Program<'info, System>,
}
