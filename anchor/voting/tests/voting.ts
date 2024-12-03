/**
 * Testing File
 * This file is used to test the voting program.
 * 
 * How to run: 
 * ``` anchor test --skip-local-validator --skip-deploy ```
 * 
 */


import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Voting } from "../target/types/voting";

const IDL = require("../target/idl/voting.json");
const CONTRACT_ADDRESS = new PublicKey("5s3PtT8kLYCv1WEp6dSh3T7EuF35Z6jSu5Cvx4hWG79H");

describe("voting", () => {
  // Default Anchor Testing Tool:
  /* anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Voting as Program<Voting>; */

  // Store the Program Data
  let context;
  let provider;
  let votingProgram;

  it("Poll Initialized!", async () => {
    // const tx = await program.methods.initialize().rpc();
    // console.log("Your transaction signature", tx);
    
    const POLL_ID = 123;

    // Initialize Program
    const context = await startAnchor("", [{name: "voting", programId: CONTRACT_ADDRESS}], []);
	  const provider = new BankrunProvider(context);
    const votingProgram = new Program<Voting>(
      IDL,
      provider,
    );

    // Call the Initialize Poll Function
    await votingProgram.methods.initializePoll(
      new anchor.BN(POLL_ID), // Poll ID
      new anchor.BN(1733213813),
      new anchor.BN(1733313813),
      "What is your favorite color?",
      "This is a voting to determine the most popular color.",
    ).rpc();

    // Get the Created Poll Object
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8) ],
      CONTRACT_ADDRESS
    )
    const poll = await votingProgram.account.pollAccount.fetch(pollAddress);
    console.log("Poll Account Successfully Initialized!")
    console.log(poll);
  });
});
