const fs = require("fs");

const totals = {
  debits: 0,
  credits: 0,
  started: 0,
  ended: 0,
  userBalance: 0
};

fs.readFile("./txnlog.dat", null, (err, data) => {
  let buffer = Buffer.from(data);

  // starting position to skip over header data
  let i = 9;

  while (i < buffer.length) {
    // collect info from buffer
    let type = buffer[i];
    let timestamp = buffer.readUInt32BE(i+1, 4);
    let id = BigInt(`0x${buffer.toString('hex', i+5, i+13)}`);
    let amount = null;

    // only calculate amount for credit and debit
    if (type <= 1) {
      let view = new DataView(new ArrayBuffer(8));
      
      // set bytes
      for (let j = 0; j < 8; j++) {
        view.setUint8(j, buffer[i+13+j]);
      }
  
      // convert to float
      amount = view.getFloat64(0);
    }

    // special case for a special user
    if (id === 2456938384156277127n) {
      totals.userBalance = amount;
    }

    // add to totals
    switch(type) {
      case 0: // debit
        totals.debits += amount;
        break;
      case 1: // credit
        totals.credits += amount;
        break;
      case 2: // startautopay
        totals.started++;
        break;
      case 3: // endautopay
        totals.ended++;
        break;
    }

    // increment i based on existence of amount data
    if (amount) {
      i += 21;
    }
    else {
      i += 13;
    }
  }

  // fin
  console.log(`
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Total Debits: $${totals.debits}
    Total Credits: $${totals.credits}
    Started Autopays: ${totals.started}
    Ended Autopays: ${totals.ended}
    ID #2456938384156277127: $${totals.userBalance}
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  `);
});