// import input from "./data";
import { canParse, parseHand } from "./holdemParser";
import { HandInterface } from "./pacific";
import { input } from "./data";

// const input2 = `#Game No : 1393225818
// ***** 888poker Snap Poker Hand History for Game 1393225818 *****
// $0.05/$0.10 Blinds No Limit Holdem - *** 16 09 2020 16:14:46
// Table Worms 6 Max (Real Money)
// Seat 1 is the button
// Total number of players : 6
// Seat 1: K.I.N.O. ( $10 )
// Seat 2: Garden2020 ( $6 )
// Seat 4: therealgrav ( $10 )
// Seat 6: jr313 ( $3.20 )
// Seat 7: Mikaelak92 ( $11.01 )
// Seat 9: felixf0815 ( $13.14 )
// Garden2020 posts small blind [$0.05]
// therealgrav posts big blind [$0.10]
// ** Dealing down cards **
// Dealt to therealgrav [ 8c, Ac ]
// jr313 folds
// Mikaelak92 folds
// felixf0815 folds
// K.I.N.O. folds
// Garden2020 folds
// ** Summary **
// therealgrav did not show his hand
// therealgrav collected [ $0.15 ]

// #Game No : 1393225868
// ***** 888poker Snap Poker Hand History for Game 1393225868 *****
// $0.05/$0.10 Blinds No Limit Holdem - *** 16 09 2020 16:15:04
// Table Worms 6 Max (Real Money)
// Seat 1 is the button
// Total number of players : 6
// Seat 1: dsotm_1973 ( $29.78 )
// Seat 2: jr313 ( $3.25 )
// Seat 4: K.I.N.O. ( $10 )
// Seat 6: therealgrav ( $10.05 )
// Seat 7: felixf0815 ( $10 )
// Seat 9: Ruopolo ( $14 )
// jr313 posts small blind [$0.05]
// K.I.N.O. posts big blind [$0.10]
// ** Dealing down cards **
// Dealt to therealgrav [ Qc, Tc ]
// therealgrav raises [$0.30]
// felixf0815 folds
// Ruopolo folds
// dsotm_1973 folds
// jr313 calls [$0.25]
// K.I.N.O. folds
// ** Dealing flop ** [ Kd, 6c, 2h ]
// jr313 checks
// therealgrav bets [$0.37]
// jr313 folds
// ** Summary **
// therealgrav did not show his hand
// therealgrav collected [ $0.67 ]

// #Game No : 1393225929
// ***** 888poker Snap Poker Hand History for Game 1393225929 *****
// $0.05/$0.10 Blinds No Limit Holdem - *** 16 09 2020 16:15:14
// Table Worms 6 Max (Real Money)
// Seat 1 is the button
// Total number of players : 6
// Seat 1: CJBplayer ( $12.74 )
// Seat 2: Mikaelak92 ( $17.89 )
// Seat 4: Jacks_Joker ( $18.41 )
// Seat 6: UnderTheSea ( $15.86 )
// Seat 7: therealgrav ( $10.42 )
// Seat 9: felixf0815 ( $13.09 )
// Mikaelak92 posts small blind [$0.05]
// Jacks_Joker posts big blind [$0.10]
// ** Dealing down cards **
// Dealt to therealgrav [ 5s, 8c ]
// UnderTheSea folds
// therealgrav folds
// felixf0815 folds
// CJBplayer folds
// Mikaelak92 folds
// ** Summary **
// Jacks_Joker did not show his hand
// Jacks_Joker collected [ $0.15 ]

// #Game No : 1393225943
// ***** 888poker Snap Poker Hand History for Game 1393225943 *****
// $0.05/$0.10 Blinds No Limit Holdem - *** 16 09 2020 16:15:24
// Table Worms 6 Max (Real Money)
// Seat 1 is the button
// Total number of players : 6
// Seat 1: therealgrav ( $10.42 )
// Seat 2: dsotm_1973 ( $29.83 )
// Seat 4: FenikSrS ( $5.68 )
// Seat 6: jr313 ( $2.95 )
// Seat 7: K.I.N.O. ( $10.15 )
// Seat 9: Mikaelak92 ( $10.96 )
// dsotm_1973 posts small blind [$0.05]
// FenikSrS posts big blind [$0.10]
// ** Dealing down cards **
// Dealt to therealgrav [ 3h, 9d ]
// jr313 folds
// K.I.N.O. folds
// Mikaelak92 folds
// therealgrav folds
// dsotm_1973 folds
// ** Summary **
// FenikSrS did not show his hand
// FenikSrS collected [ $0.15 ]

// #Game No : 1393225964
// ***** 888poker Snap Poker Hand History for Game 1393225964 *****
// $0.05/$0.10 Blinds No Limit Holdem - *** 16 09 2020 16:15:37
// Table Worms 6 Max (Real Money)
// Seat 1 is the button
// Total number of players : 6
// Seat 1: Jacks_Joker ( $19.65 )
// Seat 2: therealgrav ( $10.42 )
// Seat 4: Prominence10 ( $7.41 )
// Seat 6: felixf0815 ( $13.09 )
// Seat 7: jr313 ( $2.95 )
// Seat 9: heyuhang54 ( $4.44 )
// therealgrav posts small blind [$0.05]
// Prominence10 posts big blind [$0.10]
// ** Dealing down cards **
// Dealt to therealgrav [ 6d, Qh ]
// felixf0815 folds
// jr313 calls [$0.10]
// heyuhang54 folds
// Jacks_Joker folds
// therealgrav folds
// Prominence10 checks
// ** Dealing flop ** [ Jc, 8h, Th ]
// Prominence10 checks
// jr313 bets [$0.10]
// Prominence10 folds
// ** Summary **
// jr313 did not show his hand
// jr313 collected [ $0.24 ]

// #Game No : 1393225978
// ***** 888poker Snap Poker Hand History for Game 1393225978 *****
// $0.05/$0.10 Blinds No Limit Holdem - *** 16 09 2020 16:15:42
// Table Worms 6 Max (Real Money)
// Seat 6 is the button
// Total number of players : 6
// Seat 1: Afozzy ( $4.66 )
// Seat 2: Mikaelak92 ( $10.96 )
// Seat 4: caroil24 ( $5.09 )
// Seat 6: heyuhang54 ( $4.44 )
// Seat 7: K.I.N.O. ( $10.15 )
// Seat 9: therealgrav ( $10.37 )
// K.I.N.O. posts small blind [$0.05]
// therealgrav posts big blind [$0.10]
// ** Dealing down cards **
// Dealt to therealgrav [ 6c, Kc ]
// Afozzy folds
// Mikaelak92 folds
// caroil24 calls [$0.10]
// heyuhang54 folds
// K.I.N.O. folds
// therealgrav checks
// ** Dealing flop ** [ 3d, 3s, 3c ]
// therealgrav checks
// caroil24 bets [$0.12]
// therealgrav folds
// ** Summary **
// caroil24 did not show his hand
// caroil24 collected [ $0.24 ]

// #Game No : 1393226046
// ***** 888poker Snap Poker Hand History for Game 1393226046 *****
// $0.05/$0.10 Blinds No Limit Holdem - *** 16 09 2020 16:15:50
// Table Worms 6 Max (Real Money)
// Seat 1 is the button
// Total number of players : 6
// Seat 1: Prominence10 ( $7.26 )
// Seat 2: felixf0815 ( $12.99 )
// Seat 4: jr313 ( $3.09 )
// Seat 6: caroil24 ( $5.23 )
// Seat 7: heyuhang54 ( $4.39 )
// Seat 9: therealgrav ( $10.27 )
// felixf0815 posts small blind [$0.05]
// jr313 posts big blind [$0.10]
// ** Dealing down cards **
// Dealt to therealgrav [ 9h, 2c ]
// caroil24 folds
// heyuhang54 folds
// therealgrav folds
// Prominence10 folds
// felixf0815 folds
// ** Summary **
// jr313 did not show his hand
// jr313 collected [ $0.15 ]

// `;

const modifiedInput = input.replace(/\r\n|\r|\n/gm, "\n");
// //save input to array of hands
const hands = modifiedInput.split("\n\n\n\n");
if (!hands[hands.length]) hands.pop(); //remove last element (empty string)
// const handArray = hands.map((hand) => hand.split("\n"));
const parsed: HandInterface[] = hands?.map((hand) => (canParse(hand) ? parseHand(hand) : { error: "cant parse" }));
// console.log("parsed", parsed[1].seats, parsed[1].rake);

parsed.forEach((hand) => console.log(hand.rake, hand.info.handId));

// parsed; //?
