
use anchor_lang::{AccountDeserialize, InstructionData, ToAccountMetas};
use litesvm::LiteSVM;
use solana_sdk::{
    instruction::Instruction,
    message::Message,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_program,
    transaction::Transaction,
};

#[test]
fn test_create_market() {
    let program_id = prediction_market::id();
    let creator = Keypair::new();

    let mut svm = LiteSVM::new();
    // Adjust this path if your workspace layout differs — it should point at
    // <workspace_root>/target/deploy/prediction_market.so
    let bytes = include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../target/deploy/prediction_market.so"
    ));
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&creator.pubkey(), 1_000_000_000).unwrap();

    let market_id: u64 = 1;
    let question = "Will it rain tomorrow?".to_string();
    let resolution_time: i64 = 9_999_999_999; // far future

    let (market_pda, _bump) = Pubkey::find_program_address(
        &[b"market", creator.pubkey().as_ref(), &market_id.to_le_bytes()],
        &program_id,
    );

    let instruction = Instruction::new_with_bytes(
        program_id,
        &prediction_market::instruction::CreateMarket {
            market_id,
            question: question.clone(),
            resolution_time,
        }
        .data(),
        prediction_market::accounts::CreateMarket {
            creator: creator.pubkey(),
            market: market_pda,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[instruction], Some(&creator.pubkey()), &blockhash);
    let tx = Transaction::new(&[&creator], msg, blockhash);

    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "create_market failed: {:?}", res.err());

    let market_account = svm.get_account(&market_pda).unwrap();
    let mut data: &[u8] = &market_account.data;
    let market_state = prediction_market::state::Market::try_deserialize(&mut data).unwrap();

    assert_eq!(market_state.creator, creator.pubkey());
    assert_eq!(market_state.market_id, market_id);
    assert_eq!(market_state.question, question);
    assert_eq!(market_state.resolution_time, resolution_time);
    assert_eq!(market_state.yes_pool, 0);
    assert_eq!(market_state.no_pool, 0);
    assert_eq!(market_state.resolved, false);
}