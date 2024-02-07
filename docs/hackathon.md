# Hackathon

As this is our second GalaChain hackathon, there might be some rough edges and chaos, but hey, that's what makes a good hackathon. 

# Schedule

The Hackathon will be **48 Hours** held on **February 12-14th, 2023**

| Time (CST)      | Activity      |
| -------------   |:-------------:|
| 10:00 AM        | Start!        |
| 10:00-11:00     | Meet in the GalaChain Discord   |
| 11:00-10:00 (next 48 hours)        | Hack!     |
| 10:00 AM        | Hackathon presentations on Discord Stage, or send us a 10 min recording to highlight your hack-o-licious project! |
| After presentations/recordings have been viewed. | Winners will be announced in GalaChain Announcements via Discord.|


# Rules

There aren't many, but the standard rules we use in our Discord and in our EULAs apply. It's pretty simple: No warranties on the software of any kind (this software is still in development) and be kind. We reserve the right to kick anyone out, but just be nice to your fellow developers and we should all get along. 

We have have 2 engineers judging: Jakub Dzikowski and Jeff Eganhouse. But! Rest assured the whole GalaChain team will be putting thier two cents in. 

# Prizes

We'll be awarding everyone an Epic participation NFT. If your team wins, your entire team will get a Legendary NFT in addition to the participation NFT. Let the bragging rights begin!

# Getting Started

First, read the [Getting started guide](getting-started.md). If you get stuck contact a Gala engineer in the GalaChain General Discord chat (seriously, don't hesitate, we really want to make this process as smooth and as easy as possible).

Next, here's a helpful flow to get you developing:

1. Use the CLI to init a project from template and start a local environment
1. Use the samples in e2e tests and our reference docs for token operations to design the app flow
1. Use unit tests or any code/scripts to interact with the chain
1. Rinse, repeat until you're happy with your hack.

## Hackathon Ideas

Are you stuck on what to code up? Here's some ideas to get you started:

- Decentralized Marketplace for NFTs:
    - Create a marketplace where users can list, buy, and sell NFTs. 
    - Implement features like bidding, auctions, and royalty mechanisms for artists.
    - Enable users to create and manage their own NFT collections. 
- P2P loan platform:
    - Build a lending platform where users can request and offer loans using tokens as collateral.
    - Implement features like interest rates, loan durations, and automated repayment mechanisms.
- Fractional ownership of NFTs:
    - Allow users to purchase fractions of high-value NFTs, enabling broader access to expensive assets.
    - Implement mechanisms for managing fractional ownership, including voting, revenue sharing, and buyout options.
- Staking and yield farming:
    - Create a staking platform where users can lock up tokens to earn rewards over time.
    - Integrate yield farming mechanisms to incentivize liquidity provision and participation in the ecosystem.
- Cross-channel swaps:
    - Develop a mechanism that allows users to swap tokens between different channels.
    - In the hackathon we will use just one channel, but we can design the flow to behave like it were two channels networks (esp. design the process in a way to avoid corrupted state, support rollbacks etc.) .
- NFT-backed governance and voting:
    - Build a governance platform where NFT holders can vote on proposals related to the ecosystem.
    - Implement mechanisms to weight votes based on NFT rarity or ownership duration.
- NFT-backed loans:
    - Create a system where users can use their NFTs as collateral to borrow tokens. 
    - Implement mechanisms for assessing NFT value, liquidation in case of default, and repayment terms.
- NFT-backed insurance:
    - Create a system where users can insure their valuable NFTs against theft, loss, or damage.
    - Implement mechanisms for assessing risk, determining premiums, and processing claims.
- GalaChain attack:
    - Find flaws and/or security issues with our current operations on chain, like auth, token operations, allowances, mints, transfers
- GalaChain race:
    - Push GalaChain speed limits by attempting to max out TPS with data that is realistic (might not be good if everyone is on one channel tho)
- Get an Open Source game and enhance it with NFT
    - Find an FPS game in github and make it use an NFT gun or armor


That's it. Have Fun and Happy Hacking!