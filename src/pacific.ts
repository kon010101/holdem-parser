import { safeParseInt, safeParseFloat, safeFirstUpper, safeTrim } from "./util/string";
import { identifyPost, identifyActionType } from "./util/identfiers";
const { round } = require("mathjs");

const defaultPositions = {
  headsUp: ["BTN", "SB"],
  sixMax: ["BTN", "SB", "BB", "UTG", "MP", "CO"],
  fullRing: ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "LJ", "HJ", "CO"],
};

//###### Regular Expressions ######
//close to npm hhp package and modified

///////////// regex partials //////////
const currency = "[$€£]";

// $0.10/$0.25
const blinds = `(${currency})([^/]+)[/]${currency}([^\\s]+)`;

const type = `(?:Texas )?(Hold'em|Holdem|Omaha)`;
const limit = "NL|PL|FL|No Limit|Pot Limit|Fixed Limit|Fix Limit";
const card = `[0-9TJQKA]{1,2}[schd]`;
const flopCards = `(${card})[, ]+(${card})[, ]+(${card})`;

//line 1 (#Game No : 1393225818)
const preludeGameNoRx = /^#Game No/i;

//line 2 ( ***** 888poker Hand History for Game 503663069 ****  ***** Cassava Hand History for Game 384831647 *****)
const gameIDRx = /^[*]+ +(?:888poker|Cassava|888poker Snap Poker|888.de|888.de Snap Poker) +Hand History for Game +(\d+) +[*]+/i;

//line 3 (Cash+Tourney: $0.06/$0.12 Blinds Fix Limit Holdem - *** 17 06 2018 20:28:2)
// Fix Limit Holdem
const pokerType = `(${limit})\\s+${type}`;

// 17 06 2018 20:28:21
const dateAndTime = "(\\d+) +(\\d+) +(\\d+) +(\\d+):+(\\d+):+(\\d+)";
const gameInfoRx = new RegExp(`${blinds} +Blinds.+${pokerType}.+[*]{3} +${dateAndTime}`, "i");

// Table Embu 10 Max (Real Money)
const table = "Table\\s+([^(]+)";
const tableRx = new RegExp(`^${table}`, "i");

// Tourney only
// line 4 Tournament #83728678 $18.30 + $1.70 - Table #1 9 Max (Real Money)
const tournamentID =
  // Tournament #83728678
  "Tournament #(\\d+)";

const tournamentBuyIn =
  // $18.30 + $1.70
  `${currency}((?:[\\d]+\\.\\d+)|(?:[\\d]+)) *\\+ *${currency}((?:[\\d]+\\.\\d+)|(?:[\\d]+))`;

const tourneyGameInfoRx = new RegExp(`${tournamentID} ${tournamentBuyIn}.+${table}`);

//line 5
// Seat 5 is the button
const buttonRx = /^Seat\s+(\d+).+button/;

//line 6
// Total number of players : 2
const maxseatsRx = /^Total +number.+players.+(\d+)/i;

//lines for player infos (7+)
// Seat 5: uyangau ( $4.80 )
const seatRx = new RegExp(`^Seat (\\d+): (.+)\\(\\s*${currency}?([^ ]+)`, "i");

const holecardsRx = new RegExp(`Dealt to ([^ ]+) +\\[ *(${card})[, ]+(${card}) *]`);

//posts actions and dealing cards
// uyangau posts small blind [$0.06]
const postRx = new RegExp(
  `([^ ]+) posts (?:the )?(ante|small blind|big blind) +(?:\\+ dead )?\\[${currency}?([^\\]]+)`,
  "i"
);

// Flanx posts dead blind [$0.01 + $0.02]
const postDeadBlindRx = new RegExp(`([^ ]+) posts dead blind +\\[${currency}([^ +]+)[ +]+${currency}([^ \\]]+)\\]`);

// ** Dealing down cards **
const preflopIndicatorRx = /^\*\* Dealing down cards \*\*/i;

const multiStreetCards = `\\[ *${flopCards} *]`;
const singleStreetCards = `\\[ *(${card}) *]`;

// ** Dealing flop ** [ 4c, 3s, 7c ]
const flopIndicatorRx = new RegExp(`\\*\\* Dealing flop \\*\\* *${multiStreetCards}`, "i");

// ** Dealing turn ** [ 2c ]
const turnIndicatorRx = new RegExp(`\\*\\* Dealing turn \\*\\* *${singleStreetCards}`, "i");

// ** Dealing river ** [ 2s ]
const riverIndicatorRx = new RegExp(`\\*\\* Dealing river \\*\\* *${singleStreetCards}`, "i");

// ** Summary **
const summaryIndicatorRx = /[*]{2} Summary [*]{2}/i;

// uyangau calls [$0.06]
// Chillwill184 checks
// uyangau bets [$0.12]
const actionRx = new RegExp(`^([^ ]+) (raises|bets|calls|checks|folds|is all-In)(?: +\\[${currency}?([^\\]]+))?`, "i");

// Chillwill184 collected [ $0.94 ]
const collectRx = new RegExp(`^([^ ]+) collected +\\[ +${currency}?([^ ]+) *]`, "i");

// Chillwill184 shows [ Kh, 7h ]
const showRx = new RegExp(`^([^ ]+) shows \\[ *(${card})[, ]+(${card}) *]`, "i");

// ChesterJ28 did not show his hand
const noShowRx = /^[^ ]+ did not show his hand/;

// uyangau mucks [ 9c, 8s ]
const muckRx = new RegExp(`^([^ ]+) mucks \\[ *(${card})[, ]+(${card}) *]`, "i");

const item = {
  GAMEID: 0,
  GAMEINFO: 1,
  TABLE: 2,
  BUTTON: 3,
  MAXSEATS: 4,
  SEATS: 5,
  POSTS: 6,
  ACTIONS: 7,
};

const section = {
  SETUP: 0,
  PREFLOP: 1,
  FLOP: 2,
  TURN: 3,
  RIVER: 4,
  SHOWDOWN: 5,
};

//types and interfaces
type MetaDataType = {
  lineNo: number;
  raw: string;
};

type SeatType = {
  seatNo: number;
  stack: number;
  playerName: string;
  metaData: MetaDataType;
};

type ActionType = {
  id: number;
  playerName: string;
  street: string;
  type: string;
  amount: number;
  stackSize: number;
  potSize: number;
  metaData: MetaDataType;
};

type InfoType = {
  handId: number;
  date: Date;
  bb: number;
  sb: number;
  gameNo: number;
  currency: string;
  gametype: string;
  limit: string;
  metaData: MetaDataType[];
  ante: number;
};

interface TableInterface {
  buttonPosition: number;
  maxSeats: number;
  tableName: string;
  metaData: MetaDataType[];
}

type PlayerCard = {
  playerName: string;
  cards: string;
};

type Winning = {
  playerName: string;
  winnings: number;
};

type Investment = {
  playerName: string;
  investments: number;
};

export interface HandInterface {
  info: InfoType;
  table: TableInterface;
  heroName: string;
  heroPosition: string;
  holeCards: string;
  boardCards: { cards: string[]; metaData: MetaDataType[] };
  playerCards: PlayerCard[];
  seats: SeatType[];
  actions: ActionType[];
  winnings: Winning[];
  rake: number;
  ignored: MetaDataType[];
}

type CurrentPlayerInfoType = {
  playerName: string;
  stackSize: number;
};

//parser class
class HoldemPacificParser {
  _lines: string[];
  _section: number;
  _item: number;
  _hand: HandInterface;
  _allIns: { preflop: boolean; flop: boolean; turn: boolean; river: boolean };
  _isCashGame: boolean;
  _potSize: number;
  _currentPlayerInfos: CurrentPlayerInfoType[];
  _currentActionId: number;

  constructor(lines: string[]) {
    this._lines = lines;
    this._section = section.SETUP;
    this._item = item.GAMEID;

    this._potSize = 0;

    this._hand = {
      info: {
        metaData: [],
        bb: null,
        sb: null,
        currency: null,
        gametype: null,
        gameNo: null,
        limit: null,
        date: null,
        ante: null,
        handId: null,
      },
      table: { metaData: [], buttonPosition: null, maxSeats: null, tableName: null },
      heroName: null,
      heroPosition: null,
      holeCards: null,
      boardCards: null,
      playerCards: [],
      seats: [],
      actions: [],
      winnings: [],
      rake: 0,
      ignored: [],
    };

    //stacksizes depending on current situation
    this._currentPlayerInfos = [];
    this._currentActionId = 0;

    this._allIns = {
      preflop: false,
      flop: false,
      turn: false,
      river: false,
    };
  }

  //prelude
  _ignorePrelude(line: string) {
    return preludeGameNoRx.test(line);
  }

  //setup
  _readGameID(line: string, lineno: number) {
    const match = line.match(gameIDRx);
    if (match === null) return false;

    this._hand.info.handId = Number(match[1]);
    this._hand.info.metaData.push({ lineNo: lineno, raw: line });
    this._item++;
    return true;
  }

  _readGameInfo(line: string, lineno: number) {
    const match = line.match(gameInfoRx);
    if (match === null) return false;

    const [, currency, sb, bb, limit, type, day, month, year, hour, min, sec] = match;

    const dateString = `${year}-${month}-${day}T${hour}:${min}:${sec}`;
    const date = new Date(dateString);

    this._hand.info.date = date;
    this._hand.info.sb = Number(sb);
    this._hand.info.bb = Number(bb);
    this._hand.info.limit = limit;
    this._hand.info.currency = currency;
    this._hand.info.gametype = type;

    this._hand.info.metaData.push({ lineNo: lineno, raw: line });
    this._item++;
    return true;
  }

  _readTable(line: string, lineno: number) {
    const match = line.match(tableRx);
    if (match === null) return false;

    // Tourneys have table info as part of gameinfo
    // therefore this indicates a cash game
    this._hand.info.gametype = "cash";

    this._hand.table.tableName = match[1].trim();
    this._hand.table.metaData.push({ lineNo: lineno, raw: line });
    this._item++;
    return true;
  }

  _readTourneyInfo(line: string, lineno: number) {
    const match = line.match(tourneyGameInfoRx);
    if (match === null) return false;

    const [, gameno, donation, rake, table] = match;
    const d = safeParseFloat(donation);
    const r = safeParseFloat(rake);

    this._hand.info = Object.assign(this._hand.info, {
      donation: d,
      rake: r,
      buyin: d + r,
    });

    this._hand.info.gameNo = safeParseInt(gameno);
    this._hand.info.gametype = "tournament";

    this._hand.info.metaData.push({ lineNo: lineno, raw: line });

    this._hand.table.tableName = table.trim();
    this._hand.table.metaData.push({ lineNo: lineno, raw: line });

    this._item++;
    this._isCashGame = false;

    this._item = item.BUTTON;
    return true;
  }

  _readButton(line: string, lineno: number) {
    const match = line.match(buttonRx);
    if (match === null) return false;

    this._hand.table.buttonPosition = safeParseInt(match[1]);
    this._hand.table.metaData.push({ lineNo: lineno, raw: line });
    this._item++;
    return true;
  }

  _readMaxSeats(line: string, lineno: number) {
    const match = line.match(maxseatsRx);
    if (match === null) return false;

    this._hand.table.maxSeats = safeParseInt(match[1]);
    this._hand.table.metaData.push({ lineNo: lineno, raw: line });
    this._item++;
    return true;
  }

  _readSeat(line: string, lineno: number) {
    const match = line.match(seatRx);
    if (match === null) return false;

    const playerName = safeTrim(match[2]);
    const seatNo = safeParseInt(match[1]);
    const stack = safeParseFloat(match[3]);

    this._hand.seats.push({
      seatNo,
      playerName,
      stack,
      metaData: { lineNo: lineno, raw: line },
    });

    this._currentPlayerInfos.push({ playerName, stackSize: stack });
    this._hand.winnings.push({
      playerName,
      winnings: 0,
    });
    return true;
  }

  //everytime an action happens the playerstack gets updated here
  _updatePlayerStack(name: string, amount: number) {
    //search for player in current infos and filter
    const currInfo = this._currentPlayerInfos.filter((el) => el.playerName === name);

    let newStack = currInfo[0].stackSize - amount;
    newStack = round(newStack, 2);

    //set new currInfo
    const idx = this._currentPlayerInfos.findIndex((item) => item.playerName === name);
    this._currentPlayerInfos[idx].stackSize = newStack;

    //set winnings
    const idxWin = this._hand.winnings.findIndex((item) => item.playerName === name);
    const updatedWin = this._hand.winnings[idxWin]?.winnings - amount;
    this._hand.winnings[idxWin] = { playerName: name, winnings: round(updatedWin, 2) };

    return newStack;
  }

  _readPost(line: string, lineno: number) {
    const match = line.match(postRx);
    if (match === null) return false;

    const type = identifyPost(match[2]);
    const amount = safeParseFloat(match[3]);
    const playerName = match[1];
    this._currentActionId = this._currentActionId + 1;

    //update potsize
    const newPotSize = this._potSize + amount;
    this._potSize = round(newPotSize, 2);
    //update Stacksize of player
    const newStack = this._updatePlayerStack(playerName, amount);

    this._hand.actions.push({
      id: this._currentActionId,
      playerName: playerName,
      amount: amount,
      type: type,
      street: "preflop",
      potSize: this._potSize,
      stackSize: newStack,
      metaData: { lineNo: lineno, raw: line },
    });

    if (type === "ante" && !this._hand.info.ante) this._hand.info.ante = amount;

    return true;
  }

  _readPostDeadBlind(line: string, lineno: number) {
    const match = line.match(postDeadBlindRx);
    if (match === null) return false;

    const [, playerName, sb, bb] = match;
    const amount = safeParseFloat(sb) + safeParseFloat(bb);

    //update potsize
    const newPotSize = this._potSize + amount;
    this._potSize = round(newPotSize, 2);
    //update Stacksize of player
    const newStack = this._updatePlayerStack(playerName, amount);
    this._currentActionId = this._currentActionId + 1;

    this._hand.actions.push({
      id: this._currentActionId,
      playerName: playerName,
      amount: amount,
      type: type,
      street: "preflop",
      potSize: this._potSize,
      stackSize: newStack,
      metaData: { lineNo: lineno, raw: line },
    });
    return true;
  }

  _readSectionSetup(line: string, lineno: number) {
    if (this._item === item.GAMEID) return this._readGameID(line, lineno);
    if (this._item === item.GAMEINFO) return this._readGameInfo(line, lineno);
    if (this._item === item.TABLE) {
      return (
        this._readTable(line, lineno) || // cash game
        this._readTourneyInfo(line, lineno)
      ); // tourney (includes table)
    }
    if (this._item === item.BUTTON) return this._readButton(line, lineno);
    if (this._item === item.MAXSEATS) return this._readMaxSeats(line, lineno);
    if (this._item === item.SEATS) {
      if (this._readSeat(line, lineno)) return true;
      this._item = item.POSTS;
    }
    if (this._item === item.POSTS) {
      return this._readPost(line, lineno) || this._readPostDeadBlind(line, lineno);
    }
    return false;
  }

  // Street Indicators and Actions

  _readIndicatorPreflop(line: string) {
    const match = line.match(preflopIndicatorRx);
    if (match === null) return false;

    this._section = section.PREFLOP;
    return true;
  }

  _readIndicatorFlop(line: string, lineno: number) {
    const match = line.match(flopIndicatorRx);
    if (match === null) return false;

    this._hand.boardCards = {
      cards: [
        safeFirstUpper(safeTrim(match[1])),
        safeFirstUpper(safeTrim(match[2])),
        safeFirstUpper(safeTrim(match[3])),
      ],
      metaData: [{ lineNo: lineno, raw: line }],
    };

    this._section = section.FLOP;
    return true;
  }

  _readIndicatorTurn(line: string, lineno: number) {
    const match = line.match(turnIndicatorRx);
    if (match === null) return false;

    this._hand.boardCards.cards.push(safeFirstUpper(safeTrim(match[1])));
    this._hand.boardCards.metaData.push({ lineNo: lineno, raw: line });

    this._section = section.TURN;

    return true;
  }

  _readIndicatorRiver(line: string, lineno: number) {
    const match = line.match(riverIndicatorRx);
    if (match === null) return false;

    this._hand.boardCards.cards.push(safeFirstUpper(safeTrim(match[1])));
    this._hand.boardCards.metaData.push({ lineNo: lineno, raw: line });

    this._section = section.RIVER;

    return true;
  }

  _readIndicatorSummary(line: string) {
    if (!summaryIndicatorRx.test(line)) return false;
    this._section = section.SHOWDOWN;
    return true;
  }

  _sortCards(card1: string, card2: string) {
    //sort cards by highest first [A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2] and colors like [c, s, h, d]
    const order = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
    const colors = ["c", "s", "h", "d"];

    let indexCard1 = order.findIndex((el) => el === card1[0]);
    let indexCard2 = order.findIndex((el) => el === card2[0]);

    if (indexCard1 === indexCard2) {
      //pair order by color
      indexCard1 = colors.findIndex((el) => el === card1[1]);
      indexCard2 = colors.findIndex((el) => el === card2[1]);
    }

    const cardString = indexCard1 < indexCard2 ? `${card1}${card2}` : `${card2}${card1}`;

    return cardString;
  }

  _readHoleCards(line: string) {
    const match = line.match(holecardsRx);
    if (match === null) return false;

    const [, hero, card1, card2] = match;

    const cards = this._sortCards(card1, card2);

    this._hand.heroName = hero;
    this._hand.holeCards = cards;

    return true;
  }

  _readAction(line: string, lineno: number, street: string) {
    const match = line.match(actionRx);
    if (match === null) return false;

    // SEOULMAN is all-In  [$8.21 USD]
    // is identified as all-in call so we need to determine
    // the actual action via a post processing step
    const type = identifyActionType(match[2]);
    const amount = safeParseFloat(match[3]);
    const playerName = safeTrim(match[1]);
    this._currentActionId = this._currentActionId + 1;

    let newStack = this._currentPlayerInfos.filter((info) => info.playerName === playerName)[0].stackSize;

    //update potsize
    if (type !== "fold" && amount) {
      //update potsize
      const newPotSize = this._potSize + amount;
      this._potSize = round(newPotSize, 2);
      //update Stacksize of player
      newStack = this._updatePlayerStack(playerName, amount);
    }

    this._hand.actions.push({
      id: this._currentActionId,
      playerName: playerName,
      amount: amount,
      type: type,
      street: street,
      potSize: this._potSize,
      stackSize: newStack,
      metaData: { lineNo: lineno, raw: line },
    });

    return true;
  }

  _readCollect(line: string, lineno: number) {
    const match = line.match(collectRx);
    if (match === null) return false;

    const amount = safeParseFloat(match[2]);
    const playerName = safeTrim(match[1]);
    let newStack = this._currentPlayerInfos.find((el) => el.playerName === playerName).stackSize + this._potSize;
    newStack = round(newStack, 2);
    this._currentActionId = this._currentActionId + 1;

    this._hand.actions.push({
      id: this._currentActionId,
      playerName: playerName,
      amount: amount,
      type: "collect",
      street: "showdown",
      potSize: this._potSize,
      stackSize: newStack,
      metaData: { lineNo: lineno, raw: line },
    });

    //update winnings and add amount of potsize to winner (rake is calculated seperately)
    const idxWin = this._hand.winnings.findIndex((item) => item.playerName === playerName);
    const updatedWin = this._hand.winnings[idxWin]?.winnings + this._potSize;
    this._hand.winnings[idxWin] = { playerName, winnings: round(updatedWin, 2) };

    this._section = section.SHOWDOWN;
    return true;
  }

  _readReveal(line: string) {
    let match = line.match(showRx);

    if (match !== null) {
      const card1 = safeFirstUpper(safeTrim(match[2]));
      const card2 = safeFirstUpper(safeTrim(match[3]));

      const cardString = this._sortCards(card1, card2);

      this._hand.playerCards.push({
        playerName: safeTrim(match[1]),
        cards: cardString,
      });
    } else {
      match = line.match(muckRx);
      if (match === null) return false;
    }

    return true;
  }

  _readNoReveal(line: string) {
    return noShowRx.test(line);
  }

  //some post processing
  _setPositions() {
    const position =
      this._hand.table.maxSeats === 6
        ? defaultPositions.sixMax
        : this._hand.table.maxSeats === 9
        ? defaultPositions.fullRing
        : this._hand.table.maxSeats === 2
        ? defaultPositions.headsUp
        : [];

    const btn = this._hand.seats.findIndex((s) => s.seatNo === this._hand.table.buttonPosition);
    const hero = this._hand.seats.findIndex((s) => s.playerName === this._hand.heroName);
    const pos = hero - btn;
    this._hand.heroPosition = pos < 0 ? position[position.length + pos] : position[pos];
  }

  //calculates the rake in a cash game hand
  _calcRake() {
    const streets = ["preflop", "flop", "turn", "river", "showdown"];
    let rest = 0; //if players are all in and can not call the entire bet, this is the amount they could not call
    let lastBet = 0; //saves the last bet, and needs to be subtracted from the pot if uncalled at the end

    streets.forEach((street) => {
      const investmentsOfPlayers: Investment[] = [];
      const currActions = this._hand.actions.filter((action) => action.street === street);

      if (currActions !== []) {
        currActions.forEach((action) => {
          if (
            action.type === "sb" ||
            action.type === "bb" ||
            action.type === "raise" ||
            action.type === "bet" ||
            action.type === "call"
          ) {
            const idx = investmentsOfPlayers.findIndex((item) => item.playerName === action.playerName); //if not in array returns -1
            //any action which increases the pot
            //add amount to investments of current player
            if (idx !== -1) {
              //player exists in investment array
              const newInvest = investmentsOfPlayers[idx].investments + action.amount;
              investmentsOfPlayers[idx].investments = round(newInvest, 2);
            } else {
              investmentsOfPlayers.push({
                playerName: action.playerName,
                investments: action.amount,
              });
            }

            lastBet = action.amount;
          }

          if (action.type === "call") {
            //search for highest bet and see if it matches
            investmentsOfPlayers.sort((a, b) => b.investments - a.investments);
            let diff = 0;
            const newIdx = investmentsOfPlayers.findIndex((item) => item.playerName === action.playerName);

            //if there is a difference, the player is all in and the amount need to be subtracted from
            //collect, because it is uncalled money which is not included in amount of winnings in "collect"
            diff = investmentsOfPlayers[0].investments - investmentsOfPlayers[newIdx].investments;

            if (diff) {
              const newRest = rest + diff;
              rest = round(newRest, 2);
            }

            lastBet = 0;
          }

          if (action.type === "collect" && action.playerName === this._hand.heroName) {
            //calc rake
            const realPot = action.potSize - rest - lastBet;
            let rake = realPot - action.amount;

            if (rake > 0.1 * action.potSize || rake < 0) rake = 0;
            this._hand.rake = round(rake, 2);
          }
        });
      }
    });
  }

  parse() {
    for (let lineno = 0; lineno < this._lines.length; lineno++) {
      const line = this._lines[lineno].trim();
      if (line.length === 0) {
        //ignore empty lines at the start
        if (this._section === section.SETUP) continue;
        // consider the hand finished if we see an empty line once we started parsing
        break;
      }

      // Setup
      if (this._section === section.SETUP) {
        if (this._ignorePrelude(line)) continue;
        if (this._readSectionSetup(line, lineno)) continue;

        if (this._readIndicatorPreflop(line)) {
          this._section = section.PREFLOP;
          this._item = item.ACTIONS;
          continue;
        }

        // some folds are listed before preflop indicator as part of posts
        if (this._readAction(line, lineno, "preflop")) continue;

        if (this._item === item.GAMEID) {
          throw new Error(`Expected game setup item(s) but found:\n  ${line}`);
        } else if (this._item < item.SEATS) {
          // throw new Error(`Expected setup item ${enumString(item, this._item)}, but found:\n  ${line}`);
          throw new Error(`Expected setup item, but found:\n  ${line}`);
        }

        // ignore sitout messages once we saw at least player seats
      } else if (this._section === section.PREFLOP) {
        // Preflop
        if (this._readHoleCards(line)) continue;
        if (this._readAction(line, lineno, "preflop")) continue;
        if (this._readIndicatorFlop(line, lineno)) continue;
        if (this._readIndicatorSummary(line)) continue;
        if (this._readCollect(line, lineno)) continue;
        if (this._readReveal(line)) continue;
      } else if (this._section === section.FLOP) {
        // Flop
        if (this._readAction(line, lineno, "flop")) continue;
        if (this._readIndicatorTurn(line, lineno)) continue;
        if (this._readIndicatorSummary(line)) continue;
        if (this._readCollect(line, lineno)) continue;
        if (this._readReveal(line)) continue;
      } else if (this._section === section.TURN) {
        // Turn
        if (this._readAction(line, lineno, "turn")) continue;
        if (this._readIndicatorRiver(line, lineno)) continue;
        if (this._readIndicatorSummary(line)) continue;
        if (this._readCollect(line, lineno)) continue;
        if (this._readReveal(line)) continue;
      } else if (this._section === section.RIVER) {
        // River
        if (this._readAction(line, lineno, "river")) continue;
        if (this._readIndicatorSummary(line)) continue;
        if (this._readCollect(line, lineno)) continue;
        if (this._readReveal(line)) continue;
      } else if (this._section === section.SHOWDOWN) {
        // Showdown
        if (this._readCollect(line, lineno)) continue;
        if (this._readReveal(line)) continue;
        if (this._readNoReveal(line)) continue;
      }

      this._hand.ignored.push({ lineNo: lineno, raw: line });
    }

    //set positions for seats
    this._setPositions();

    //calculate rake in cash game hands
    if (this._hand.info.gametype === "cash") {
      this._calcRake();
    }

    return this._hand;
  } //end for loop
}

function parse(lines: string[]) {
  return new HoldemPacificParser(lines).parse();
}

function canParse(lines: string[]) {
  const fl = lines[0];
  return gameIDRx.test(fl) || preludeGameNoRx.test(fl);
}

export { canParse, parse };
