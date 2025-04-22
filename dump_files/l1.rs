use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::InstructionData; // Import the InstructionData trait

declare_id!("FM2zDi5UkY3UqbZoVVF62KRcj6udk8H2kK14iduevuF5"); // Admin program ID

#[program]
pub mod cpi_caller {
    use super::*;

    pub fn call_update_game_config_via_cpi(
        ctx: Context<CallUpdateGameConfigViaCpi>,
        new_min: u64,
        new_max: u64,
    ) -> Result<()> {
        // Use the program ID of the owning program (Smart Contract A)
        let program_a_id = pubkey!("CY79LabWnL8x2WFfu2PKYhhVwkVDdKtbFf3FoaAZzy9M");

      
        // Ensure the passed config matches the derived PDA

        // Create the CPI instruction
        let ix = Instruction {
            program_id: ctx.accounts.game_program.key(), // Smart Contract A's program ID
            accounts: vec![
                AccountMeta::new(ctx.accounts.config.key(), false), // Game config PDA
                AccountMeta::new_readonly(ctx.accounts.authority.key(), true), // Authority PDA
                AccountMeta::new_readonly(ctx.accounts.admin_program.key(), false), // Admin program
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false), // System program
            ],
            data: UpdateGameConfig { new_min, new_max }.data(), // Serialize the instruction data
        };

        // Make the CPI call
        invoke_signed(
            &ix,
            &[
                ctx.accounts.config.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.admin_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[&[b"admin", &[authority_bump]]], // Signer seeds
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CallUpdateGameConfigViaCpi<'info> {
    #[account(
        seeds = [b"admin"],
        bump,
        seeds::program = pubkey!("CY79LabWnL8x2WFfu2PKYhhVwkVDdKtbFf3FoaAZzy9M") // Explicitly specify the program ID
    )]
    /// CHECK: This is the authority PDA derived using seeds. It is safe because the seeds are verified.
    pub authority: UncheckedAccount<'info>, // Authority PDA

    #[account(
        mut,
        seeds = [b"game-config"],
        bump,
        seeds::program = pubkey!("CY79LabWnL8x2WFfu2PKYhhVwkVDdKtbFf3FoaAZzy9M") // Explicitly specify the program ID
    )]
    /// CHECK: This is the game config PDA owned by the `casnic` program.
    pub config: UncheckedAccount<'info>, // Game config PDA

    #[account(
        address = pubkey!("CY79LabWnL8x2WFfu2PKYhhVwkVDdKtbFf3FoaAZzy9M") // Static string literal for game program ID
    )]
    /// CHECK: This is the game program ID. It is safe because it is a known constant.
    pub game_program: UncheckedAccount<'info>, // Game program

    #[account(
        address = pubkey!("CY79LabWnL8x2WFfu2PKYhhVwkVDdKtbFf3FoaAZzy9M") // Static string literal for admin program ID
    )]
    /// CHECK: This is the admin program ID. It is safe because it is a known constant.
    pub admin_program: UncheckedAccount<'info>, // Admin program

    pub system_program: Program<'info, System>, // System program
}

#[account]
pub struct GameConfig {
    pub min_multiplier: u64,
    pub max_multiplier: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateGameConfig {
    pub new_min: u64,
    pub new_max: u64,
}

impl anchor_lang::InstructionData for UpdateGameConfig {
    fn data(&self) -> Vec<u8> {
        let mut buf = Vec::new();
        buf.extend_from_slice(&self.new_min.to_le_bytes());
        buf.extend_from_slice(&self.new_max.to_le_bytes());
        buf
    }
}

impl anchor_lang::Discriminator for UpdateGameConfig {
    const DISCRIMINATOR: [u8; 8] = [0; 8]; // Replace with a unique 8-byte discriminator
}

