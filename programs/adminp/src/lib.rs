use anchor_lang::prelude::*;


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

       // Removed the Sensitive code
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
