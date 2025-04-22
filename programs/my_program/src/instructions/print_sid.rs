use anchor_lang::prelude::*;

#[derive(Accounts)]  // <--- This is required
pub struct PrintSid<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
}

impl<'info> PrintSid<'info> {
    pub fn print(&self) {
        msg!("Printing Studio: King Pin");
    }
}
