// game_update.rs
use anchor_lang::prelude::*;
use crate::states::GameConfig;

pub const ADMIN_SEED: &[u8] = b"admin";

#[derive(Accounts)]
pub struct UpdateGameConfig<'info> {
    // Human signer pays for first-time init
    #[account(mut)]
    pub admin_signer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = admin_signer,
        seeds = [GameConfig::SEED_PREFIX.as_bytes()],
        bump,
        space = 8 + GameConfig::LEN
    )]
    pub config: Account<'info, GameConfig>,

    /// CHECK: Verified via PDA logic
    #[account(seeds = [ADMIN_SEED], bump)]
    pub authority: UncheckedAccount<'info>,

    /// CHECK: This is the external admin program (Program B) calling the authority
    pub admin_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn update_game_config(
    ctx: Context<UpdateGameConfig>,
    new_min: u64,
    new_max: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    config.admin_program_id = *ctx.accounts.admin_program.key;
    // 1. First-time setup: store Program B's ID
//     if config.min_multiplier == 0 && config.max_multiplier == 0 {
//         config.admin_program_id = *ctx.accounts.admin_program.key;
//     } else {
// // Add debugging messages
//     msg!("Passed Admin Program ID: {}", ctx.accounts.admin_program.key());
//     msg!("Stored Admin Program ID: {}", config.admin_program_id);
            
//             // 2. On subsequent calls, verify the admin program matches
//         require_keys_eq!(
//             ctx.accounts.admin_program.key(),
//             config.admin_program_id,
//             CustomError::Unauthorized
//         );
//     }

    // // 3. Verify PDA (`authority`) matches the derived address from admin_program
    // let expected_authority = Pubkey::create_program_address(
    //     &[ADMIN_SEED, &[ctx.bumps.authority]],
    //     &ctx.accounts.admin_program.key(),
    // )
    // .map_err(|_| CustomError::Unauthorized)?;

    // require_keys_eq!(
    //     ctx.accounts.authority.key(),
    //     expected_authority,
    //     CustomError::Unauthorized
    // );

    // 4. Now safe to update config
    config.min_multiplier = new_min;
    config.max_multiplier = new_max;

    Ok(())
}

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized admin call")]
    Unauthorized,
}
