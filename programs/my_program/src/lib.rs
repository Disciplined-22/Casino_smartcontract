use anchor_lang::prelude::*;

pub mod instructions;
pub mod states;
pub mod utils;



use crate::instructions::*;
// use crate::instructions::*;

declare_id!("CY79LabWnL8x2WFfu2PKYhhVwkVDdKtbFf3FoaAZzy9M");

#[program]
pub mod my_program {
    use super::*;

    
    //  called by admin to set global config
    //  need to check the signer is authority
    // pub fn configure(ctx: Context<Configure>, new_config: Config) -> Result<()> {
    //     ctx.accounts.process(new_config)
    // }

    //  //  called by a creator to launch a token on the platform
    //  pub fn launch<'info>(
    //     ctx: Context<'_, '_, '_, 'info, Launch<'info>>,

    //     //  metadata
    //     name: String,
    //     symbol: String,
    //     uri: String,
    // ) -> Result<()> {
    //     ctx.accounts
    //         .process(name, symbol, uri, ctx.bumps.global_config)
    // }
  
    // pub fn print_sid<'info>(
    //     ctx: Context<'_, '_, '_, 'info, PrintSid<'info>>  // ✅ Now using all 4 lifetimes
    // ) -> Result<()> {
    //     ctx.accounts.print();
    //     Ok(())
    // }
    
    pub fn update_game_config<'info>(
        ctx: Context<'_, '_, '_, 'info, UpdateGameConfig<'info>>,
        new_min: u64,
        new_max: u64,
    ) -> Result<()> {
        game_update::update_game_config(ctx, new_min, new_max)
    }
}

