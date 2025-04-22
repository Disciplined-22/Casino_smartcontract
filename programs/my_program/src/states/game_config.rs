use anchor_lang::prelude::*;

#[account]
pub struct GameConfig {
    pub min_multiplier: u64,
    pub max_multiplier: u64,
    pub admin_program_id: Pubkey, // Added field to store the admin program ID
}

impl GameConfig {
    pub const SEED_PREFIX: &'static str = "game-config";
    pub const LEN: usize = 32 + 32 + 8 * 6 + 8 * 3;
}