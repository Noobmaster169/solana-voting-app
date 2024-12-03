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
import { expect } from "chai";

const IDL = require("../target/idl/voting.json");
const CONTRACT_ADDRESS = new PublicKey("5s3PtT8kLYCv1WEp6dSh3T7EuF35Z6jSu5Cvx4hWG79H");

const POLL_ID = 123;
const POLL_START = 1733213813;
const POLL_END = 1733313813;
const POLL_NAME = "What is your favorite color?"
const POLL_DESCRIPTION = "This is a voting to determine the most popular color.";
const FIRST_CANDIDATE = "Red";
const SECOND_CANDIDATE = "Blue";
const THIRD_CANDIDATE = "Green";
const VOTING_DATA = ["Red", "Blue", "Green", "Red", "Red", "Blue"] // R:3, B:2, G:1

describe("voting", () => {
  // Default Anchor Testing Tool:
  /* anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Voting as Program<Voting>; */

  // Store the Program Data
  let context;
  let provider;
  let votingProgram;

  before(async () => {
    context = await startAnchor("", [{name: "voting", programId: CONTRACT_ADDRESS}], []);
	  provider = new BankrunProvider(context);
    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  });

  /*it("is initialized", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });*/

  it("Poll Initialized", async () => {
    // Call the Initialize Poll Function
    await votingProgram.methods.initializePoll(
      new anchor.BN(POLL_ID), 
      new anchor.BN(POLL_START),
      new anchor.BN(POLL_END),
      POLL_NAME,
      POLL_DESCRIPTION,
    ).rpc();

    // Get the Created Poll Object
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8) ],
      CONTRACT_ADDRESS
    )
    const poll = await votingProgram.account.pollAccount.fetch(pollAddress);
    console.log("Poll Account Successfully Initialized!")
    console.log(poll);

    // Check the Data of the Poll
    expect(poll.pollId.toNumber()).to.equal(POLL_ID);
    expect(poll.pollVotingStart.toNumber()).to.equal(POLL_START);
    expect(poll.pollVotingEnd.toNumber()).to.equal(POLL_END);
    expect(poll.pollName).to.equal(POLL_NAME);
    expect(poll.pollDescription).to.equal(POLL_DESCRIPTION);
    expect(poll.pollOptionIndex.toNumber()).to.equal(0);
    console.log("Poll Account Data Check Successful!");
  });

  it("Initialize Poll Candidate", async () => {
    // Get the Poll Account
    const [pollAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8) ],
      CONTRACT_ADDRESS
    )
    
    // Call the InitializeCandidate Function    
    await votingProgram.methods.initializeCandidate(new anchor.BN(POLL_ID), FIRST_CANDIDATE, ).accounts({pollAccount}).rpc();
    await votingProgram.methods.initializeCandidate(new anchor.BN(POLL_ID), SECOND_CANDIDATE,).accounts({pollAccount}).rpc();
    await votingProgram.methods.initializeCandidate(new anchor.BN(POLL_ID), THIRD_CANDIDATE, ).accounts({pollAccount}).rpc();

    // Get the Initialized Candidates
    const [firstCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8), Buffer.from(FIRST_CANDIDATE)],
      CONTRACT_ADDRESS
    );
    const [secondCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8), Buffer.from(SECOND_CANDIDATE)],
      CONTRACT_ADDRESS
    );
    const [thirdCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8), Buffer.from(THIRD_CANDIDATE)],
      CONTRACT_ADDRESS
    );

    // Get the Candidate Data
    const firstCandidate  = await votingProgram.account.candidateAccount.fetch(firstCandidateAddress);
    const secondCandidate = await votingProgram.account.candidateAccount.fetch(secondCandidateAddress);
    const thirdCandidate  = await votingProgram.account.candidateAccount.fetch(thirdCandidateAddress);
    console.log(firstCandidate);
    console.log(secondCandidate);
    console.log(thirdCandidate);

    // Check the Data of the Candidates
    expect(firstCandidate.candidateName).to.equal(FIRST_CANDIDATE);
    expect(secondCandidate.candidateName).to.equal(SECOND_CANDIDATE);
    expect(thirdCandidate.candidateName).to.equal(THIRD_CANDIDATE);
    expect(firstCandidate.candidateVotes.toNumber()).to.equal(0);
    expect(secondCandidate.candidateVotes.toNumber()).to.equal(0);
    expect(thirdCandidate.candidateVotes.toNumber()).to.equal(0);
  });

  it("Add Vote", async () => {
    // Get the Poll Account
    const [pollAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8) ],
      CONTRACT_ADDRESS
    )
  
    // Iterate through Every Voting
    for(let i = 0; i < VOTING_DATA.length; i++){
      const votedCandidate = VOTING_DATA[i];
      // Get the Candidate Account
      const [candidateAccount] = PublicKey.findProgramAddressSync(
        [new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8), Buffer.from(votedCandidate)],
        CONTRACT_ADDRESS
      );
      // Call the Vote function in the Smart Contract
      await votingProgram.methods.vote(new anchor.BN(POLL_ID), votedCandidate).accounts({pollAccount, candidateAccount}).rpc();
      console.log("Successfully Voted for Candidate: ", votedCandidate);
    };
    console.log("Voting Ended");

    // Get the Initialized Candidates
    const [firstCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8), Buffer.from(FIRST_CANDIDATE)],
      CONTRACT_ADDRESS
    );
    const [secondCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8), Buffer.from(SECOND_CANDIDATE)],
      CONTRACT_ADDRESS
    );
    const [thirdCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(POLL_ID).toArrayLike(Buffer, "le", 8), Buffer.from(THIRD_CANDIDATE)],
      CONTRACT_ADDRESS
    );

    // Get the Candidate Data
    const firstCandidate  = await votingProgram.account.candidateAccount.fetch(firstCandidateAddress);
    const secondCandidate = await votingProgram.account.candidateAccount.fetch(secondCandidateAddress);
    const thirdCandidate  = await votingProgram.account.candidateAccount.fetch(thirdCandidateAddress);
    console.log(firstCandidate);
    console.log(secondCandidate);
    console.log(thirdCandidate);

    // Check the Data of the Candidates
    expect(firstCandidate.candidateVotes.toNumber()).to.equal(3);
    expect(secondCandidate.candidateVotes.toNumber()).to.equal(2);
    expect(thirdCandidate.candidateVotes.toNumber()).to.equal(1);
  });
});
