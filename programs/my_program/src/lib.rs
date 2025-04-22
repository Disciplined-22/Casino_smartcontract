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

   
  
  
    // pub fn print_sid<'info>(
    //     ctx: Context<'_, '_, '_, 'info, PrintSid<'info>>  // ✅ Now using all 4 lifetimes
    // ) -> Result<()> {
    //     ctx.accounts.print();
    //     Ok(())
    // }
    
    // Removed the Sensitive code
  
}

