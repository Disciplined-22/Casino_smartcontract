import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyProgram } from "../target/types/my_program";
import { Adminp } from "../target/types/adminp";
const os = require("os");
import { assert } from "chai";
import * as web3 from "@solana/web3.js";
// import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
// import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import * as fs from 'fs';
// import idl from "../target/idl/pump.json";  // ✅ Import the IDL file
// const METADATA_PROGRAM_ID = new web3.PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
import * as path from "path";

const idl = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../target/idl/my_program.json"), "utf-8"));

// console.log("IDL-->", idl);

describe("Pump Program Tests", () => {
  
  

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const programId = new web3.PublicKey("CY79LabWnL8x2WFfu2PKYhhVwkVDdKtbFf3FoaAZzy9M");
 
  const program = new Program<MyProgram>(idl as MyProgram, provider);  // ✅ Fix program initialization

  const idlT = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../target/idl/adminp.json"), "utf-8"));
  const programT = new Program<Adminp>(idlT as Adminp, provider);  // ✅ Fix program initialization



  const walletPath = path.join(os.homedir(), ".config", "solana", "id.json");

  const adminKeypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  
  // console.log("adminKeypairData -->", adminKeypairData);


  // const adminKeypairData = JSON.parse(
  //   fs.readFileSync("target/deploy/my_program-keypair.json", "utf-8")
  // );


  // console.log("adminKeypairData-->", adminKeypairData);
  const adminKeypair = web3.Keypair.fromSecretKey(new Uint8Array(adminKeypairData));
  const adminPubkey = adminKeypair.publicKey;

  const [globalConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global-config")],
    program.programId
  );

  const newConfig = {
    authority: adminPubkey,
    feeRecipient: web3.Keypair.generate().publicKey,
    curveA: new anchor.BN(100),
    curveB: new anchor.BN(50),
    curveLimit: new anchor.BN(100000),
    initialRealTokenReserves: new anchor.BN(5000),
    initialTokenReserves: new anchor.BN(10000),
    totalTokenSupply: new anchor.BN(1000000),
    buyFeePercent: 0.02,
    sellFeePercent: 0.02,
    migrationFeePercent: 0.01,
  };

  const tokenName = "Test Token";
  const tokenSymbol = "TEST";
  const tokenUri = "https://test.com/metadata.json";

  async function logComputeUnitsWithRetry(
    signature: string,
    description: string,
    maxRetries = 3,
    delayMs = 2000 // Wait 2 seconds between retries
  ) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const txDetails = await provider.connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
  
      if (txDetails && txDetails.meta) {
        const computeUnitsConsumed = txDetails.meta.computeUnitsConsumed;
        console.log(`🔍 ${description} - Compute Units Consumed: ${computeUnitsConsumed}`);
        return;
      }
  
      console.log(`⏳ Attempt ${attempt}/${maxRetries} - Logs not found yet, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  
    console.log(`❌ Unable to fetch compute units for ${description} after ${maxRetries} retries`);
  }

  async function logComputeUnits(signature: string, description: string) {
    const txDetails = await provider.connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (txDetails && txDetails.meta) {
      const computeUnitsConsumed = txDetails.meta.computeUnitsConsumed;
      console.log(`🔍 ${description} - Compute Units Consumed: ${computeUnitsConsumed}`);
    } else {
      console.log(`❌ Unable to fetch compute units for ${description}`);
    }
  }

  // ...existing code...


  // ...existing setup code...

  it("Can update game config via direct CPI", async () => {
    // Derive PDAs
    const [authorityPDA, authorityBump] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("admin")],
      program.programId
    );
  
    const [gameConfigPDA, configBump] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game-config")],
      program.programId
    );
  
    console.log("Testing game update with accounts:");
    console.log("Authority PDA:", authorityPDA.toBase58());
    console.log("Game Config PDA:", gameConfigPDA.toBase58());
    console.log("Admin Pubkey (Payer):", adminPubkey.toBase58());
    console.log("Program ID:", program.programId.toBase58());
  
    // Perform the update
    const tx = await program.methods
      .updateGameConfig(new anchor.BN(100), new anchor.BN(200)) // Arguments as per IDL
      .accounts({
        adminSigner: adminPubkey,          // Payer account
        config: gameConfigPDA,             // Game config PDA
        authority: authorityPDA,           // Authority PDA
        adminProgram: new web3.PublicKey("FM2zDi5UkY3UqbZoVVF62KRcj6udk8H2kK14iduevuF5"), // Hardcoded program ID
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([adminKeypair])  // Add adminKeypair as signer since it's paying
      .rpc();
  
    console.log("✅ Game update transaction successful:", tx);
  
    // Verify the update
    const configAfter = await program.account.gameConfig.fetch(gameConfigPDA);
    console.log("\n📊 Updated Config Values:");
    console.log("- Min Multiplier:", configAfter.minMultiplier.toString());
    console.log("- Max Multiplier:", configAfter.maxMultiplier.toString());
    console.log("- Admin Program ID _1:", configAfter.adminProgramId.toBase58()); // Log admin_program_id
    // Add assertions
    assert.ok(configAfter.minMultiplier.eq(new anchor.BN(100)));
    assert.ok(configAfter.maxMultiplier.eq(new anchor.BN(200)));
  });

  


  // it("Can update game config via direct CPI2", async () => {

  //   // Derive PDAs
  //   const [authorityPDA, authorityBump] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from("admin")],
  //     program.programId
  //   );
  
  //   const [gameConfigPDA, configBump] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from("game-config")],
  //     program.programId
  //   );
  
  //   console.log("Testing game update with accounts:");
  //   console.log("Authority PDA:", authorityPDA.toBase58());
  //   console.log("Game Config PDA:", gameConfigPDA.toBase58());
  //   console.log("Admin Pubkey (Payer):", adminPubkey.toBase58());
  //   console.log("Program ID:", program.programId.toBase58());
  
  //   // Perform the update
  //   const tx = await programT.methods
  //     .callUpdateGameConfig(new anchor.BN(100), new anchor.BN(200)) // Arguments as per IDL
  //     .accounts({
  //       adminSigner: adminPubkey,          // Payer account
  //       config: gameConfigPDA,             // Game config PDA
  //       authority: authorityPDA,           // Authority PDA
  //       adminProgram: programT.programId, // Hardcoded program ID
  //       // systemProgram: web3.SystemProgram.programId,
  //     })
  //     .signers([adminKeypair])  // Add adminKeypair as signer since it's paying
  //     .rpc();
  
  //   console.log("✅ Game update transaction successful:", tx);
  
  //   // Verify the update
  //   const configAfter = await program.account.gameConfig.fetch(gameConfigPDA);
  //   console.log("\n📊 Updated Config Values:");
  //   console.log("- Min Multiplier:", configAfter.minMultiplier.toString());
  //   console.log("- Max Multiplier:", configAfter.maxMultiplier.toString());
  //   console.log("- Admin Program ID _1:", configAfter.adminProgramId.toBase58()); // Log admin_program_id

  //   // Add assertions
  //   assert.ok(configAfter.minMultiplier.eq(new anchor.BN(100)));
  //   assert.ok(configAfter.maxMultiplier.eq(new anchor.BN(200)));

  // });




  // it("Can update game config via CPI with different values 2 2 2", async () => {
  //   // Derive PDAs
  //   const [authorityPDA, authorityBump] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from("admin")],
  //     program.programId
  //   );

  //   const [gameConfigPDA, configBump] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from("game-config")],
  //     program.programId
  //   );

  //   console.log("Testing game update with accounts:");
  //   console.log("Authority PDA:", authorityPDA.toBase58());
  //   console.log("Game Config PDA:", gameConfigPDA.toBase58());
  //   console.log("Admin Pubkey (Payer):", adminPubkey.toBase58());
  //   console.log("Program ID:", program.programId.toBase58());

  //   try {
  //     // Fetch initial config for comparison
  //     const configBefore = await program.account.gameConfig.fetch(gameConfigPDA);
  //     console.log("\n📊 Initial Config Values:");
  //     console.log("- Min Multiplier:", configBefore.minMultiplier.toString());
  //     console.log("- Max Multiplier:", configBefore.maxMultiplier.toString());

  //     // Perform the update
  //     const tx = await program.methods
  //       .updateGameConfig(new anchor.BN(700), new anchor.BN(800))
  //       .accounts({
  //         // adminSigner: adminPubkey,          // Payer account
  //         config: gameConfigPDA,             // Game config PDA
  //         authority: authorityPDA,           // Authority PDA
  //         adminProgram: new web3.PublicKey("FM2zDi5UkY3UqbZoVVF62KRcj6udk8H2kK14iduevuF5"), // Hardcoded program ID
  //         systemProgram: web3.SystemProgram.programId,
  //       })
  //       .rpc();

  //     console.log("✅ Game update transaction successful:", tx);

  //     // Verify the update
  //     const configAfter = await program.account.gameConfig.fetch(gameConfigPDA);
  //     console.log("\n📊 Updated Config Values:");
  //     console.log("- Min Multiplier:", configAfter.minMultiplier.toString());
  //     console.log("- Max Multiplier:", configAfter.maxMultiplier.toString());

  //     // Add assertions
  //     assert.ok(configAfter.minMultiplier.eq(new anchor.BN(700)));
  //     assert.ok(configAfter.maxMultiplier.eq(new anchor.BN(800)));

  //     // Show the changes
  //     console.log("\n📈 Value Changes:");
  //     console.log("Min Multiplier:", `${configBefore.minMultiplier} -> ${configAfter.minMultiplier}`);
  //     console.log("Max Multiplier:", `${configBefore.maxMultiplier} -> ${configAfter.maxMultiplier}`);
  //     console.log("- Admin Program ID:", configAfter.adminProgramId.toBase58()); // Log admin_program_id
  //   } catch (error) {
  //     console.error("Error updating game config:", error);
  //     throw error;
  //   }
  // });


  // it("Can update game config via CPI with different values 2 2 2 44", async () => {


  //   const [gameConfigPDA, configBump] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from("game-config")],
  //     program.programId
  //   );

  //   console.log("Game Config PDA:", gameConfigPDA.toBase58());
 
  // const configBefore = await program.account.gameConfig.fetch(gameConfigPDA);
  //       console.log("\n📊 Initial Config Values:");
  //     console.log("- Min Multiplier:", configBefore.minMultiplier.toString());
  //     console.log("- Max Multiplier:", configBefore.maxMultiplier.toString());

  // }
  // );

//   it("updated via cpi 2 ", async () => {
//     // Derive PDAs
//     const [authorityPDA, authorityBump] = web3.PublicKey.findProgramAddressSync(
//       [Buffer.from("admin")],
//       program.programId
//     );

//     const [gameConfigPDA, configBump] = web3.PublicKey.findProgramAddressSync(
//       [Buffer.from("game-config")],
//       program.programId
//     );

//     console.log("Testing game update with accounts:");
//     console.log("Authority PDA:", authorityPDA.toBase58());
//     console.log("Game Config PDA:", gameConfigPDA.toBase58());
//     console.log("Admin Pubkey (Payer):", adminPubkey.toBase58());
//     console.log("Program ID:", program.programId.toBase58());

//     try {
      
//       const configBefore = await program.account.gameConfig.fetch(gameConfigPDA);
//       console.log("\n📊 Initial Config Values:");
//       console.log("- Min Multiplier:", configBefore.minMultiplier.toString());
//       console.log("- Max Multiplier:", configBefore.maxMultiplier.toString());

      
//       const tx = await program.methods
//         .updateGameConfig(new anchor.BN(700), new anchor.BN(800))
//         .accounts({
// //           adminSigner: adminPubkey,          // Payer account
//           config: gameConfigPDA,             // Game config PDA
//           authority: authorityPDA,           // Authority PDA
//           adminProgram: program.programId,   // Current program as admin
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .rpc();

//       console.log("✅ Game update transaction successful:", tx);

//       // Verify the update
//       const configAfter = await program.account.gameConfig.fetch(gameConfigPDA);
//       console.log("\n📊 Updated Config Values:");
//       console.log("- Min Multiplier:", configAfter.minMultiplier.toString());
//       console.log("- Max Multiplier:", configAfter.maxMultiplier.toString());

//       // Add assertions
//       assert.ok(configAfter.minMultiplier.eq(new anchor.BN(700)));
//       assert.ok(configAfter.maxMultiplier.eq(new anchor.BN(800)));

//       // Show the changes
//       console.log("\n📈 Value Changes:");
//       console.log("Min Multiplier:", `${configBefore.minMultiplier} -> ${configAfter.minMultiplier}`);
//       console.log("Max Multiplier:", `${configBefore.maxMultiplier} -> ${configAfter.maxMultiplier}`);
//     } catch (error) {
//       console.error("Error updating game config:", error);
//       throw error;
//     }
//   });

  // it("Configures", async () => {
  //   // const airdropSignature = await provider.connection.requestAirdrop(
  //   //   adminPubkey,
  //   //   web3.LAMPORTS_PER_SOL * 2
  //   // );
  //   // await provider.connection.confirmTransaction(airdropSignature);

  //   const configureTx = await program.methods
  //     .configure(newConfig)
  //     .accounts({
  //       admin: adminPubkey,
  //       globalConfig: globalConfigPDA,
  //       systemProgram: web3.SystemProgram.programId,
  //     })
  //     .signers([adminKeypair])
  //     .rpc();

  //   console.log("✅ Configure transaction successful, TX:", configureTx);

  //   // Log compute units consumed with retry
  //   await logComputeUnitsWithRetry(configureTx, "Configure Transaction");
  // });

  // it("Launching a Token", async () => {
  //   const tokenMint = web3.Keypair.generate();
  //   console.log("🔑 New Token Mint Public Key:", tokenMint.publicKey.toBase58());
  
  //   // Ensure correct PDA derivation
  //   const [bondingCurvePDA] = web3.PublicKey.findProgramAddressSync(
  //     [Buffer.from("bonding-curve"), tokenMint.publicKey.toBuffer()],
  //     program.programId
  //   );
  
  //   const curveTokenAccountPDA = getAssociatedTokenAddressSync(
  //     tokenMint.publicKey,  // Mint
  //     bondingCurvePDA,      // Owner (PDA)
  //     true,                 // ✅ Allow PDA as Owner
  //     TOKEN_PROGRAM_ID
  //   );
    
  //   console.log("🚀 Launching with accounts:");
  //   console.log("- Creator:", adminPubkey.toBase58());
  //   console.log("- Token Mint:", tokenMint.publicKey.toBase58());
  //   console.log("- Bonding Curve PDA:", bondingCurvePDA.toBase58());
  //   console.log("- Curve Token Account PDA:", curveTokenAccountPDA.toBase58());
  
  //   const launchTx = await program.methods
  //     .launch(tokenName, tokenSymbol, tokenUri)
  //     .accounts({
  //       creator: adminPubkey,
  //       globalConfig: globalConfigPDA,
  //       tokenMint: tokenMint.publicKey, // ✅ Pass public key
  //       bondingCurve: bondingCurvePDA,
  //       curveTokenAccount: curveTokenAccountPDA,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //       systemProgram: web3.SystemProgram.programId,
  //       rent: web3.SYSVAR_RENT_PUBKEY,
  //     })
  //     .signers([adminKeypair, tokenMint]) // ✅ Pass tokenMint Keypair
  //     .rpc();
  
  //   console.log("✅ Launch transaction successful, TX:", launchTx);

  //   // Log compute units consumed with retry
  //   await logComputeUnitsWithRetry(launchTx, "Launch Transaction");
  // });
 
 
 
  // async function fetchTransactionWithLogs(signature: string, maxRetries = 3, delayMs = 5000) {
  //   for (let attempt = 1; attempt <= maxRetries; attempt++) {
  //     const txDetails = await provider.connection.getTransaction(signature, {
  //       commitment: "confirmed", // Ensure transaction is confirmed
  //       maxSupportedTransactionVersion: 0,
  //     });
  
  //     if (txDetails && txDetails.meta && txDetails.meta.logMessages) {
  //       console.log(`🔍 On-chain Logs (Fetched in ${attempt} attempt(s))`);
  //       txDetails.meta.logMessages.forEach((log) => console.log(log));
  //       return;
  //     }
  
  //     console.log(`⏳ Attempt ${attempt}/${maxRetries} - Logs not found yet, retrying...`);
  //     await new Promise((resolve) => setTimeout(resolve, delayMs));
  //   }
  
  //   console.log("❌ No logs found after retries!");
  // }
  
  // it("Calls PrintSid", async () => {

  //   console.log("\n🔹 Calling print_sid...");
  
  //   const txSignature = await program.methods
  //     .printSid()
  //     .accounts({
  //       signer: adminPubkey,
  //     })
  //     .signers([adminKeypair])
  //     .rpc();
  
  //   console.log("✅ print_sid Transaction Sent");
  //   console.log("🔹 Transaction Signature:", txSignature);

  //   // Log compute units consumed with retry
  //   await logComputeUnitsWithRetry(txSignature, "PrintSid Transaction");
  
  //   // 🟢 Fetch transaction details with retries
  //   await fetchTransactionWithLogs(txSignature);
  
  //   assert.ok(txSignature);
  // });

  

  
});