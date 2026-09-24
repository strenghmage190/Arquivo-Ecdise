const fs = require('fs');

let c = fs.readFileSync('src/components/modals/CreatorHub.tsx', 'utf8');

c = c.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect } from 'react';\nimport { VirtuosoGrid } from 'react-virtuoso';");

c = c.replace(
  /<div className="cards-grid">\s*\{cards\.filter\(c => !c\.is_hidden\)\.map\(card => \(\s*<div key=\{card\.id\} className="card-summary">/,
  `<VirtuosoGrid
                  style={{ height: '400px', width: '100%' }}
                  listClassName="cards-grid"
                  data={cards.filter(c => !c.is_hidden)}
                  itemContent={(index, card) => (
                    <div className="card-summary">`
);

c = c.replace(
  /<div className="cards-grid">\s*\{cards\.filter\(c => c\.is_hidden\)\.map\(card => \(\s*<div key=\{card\.id\} className="card-summary hidden-clue">/,
  `<VirtuosoGrid
                    style={{ height: '300px', width: '100%' }}
                    listClassName="cards-grid"
                    data={cards.filter(c => c.is_hidden)}
                    itemContent={(index, card) => (
                      <div className="card-summary hidden-clue">`
);

// We replace `</div>\n                      </div>\n                    ))}\n                  </div>`
// with `</div>\n                      </div>\n                    )}\n                  />`
// The regex `<\/div>\s*\}\)\}\s*<\/div>` matches `<div className="card-summary">`'s closing tag AND `<div className="cards-grid">` closing tag.
// So we must output TWO `</div>`s! Wait, no.
// If the original has:
// </div> // end of card-actions
// </div> // end of card-summary
// ))}
// </div> // end of cards-grid
//
// My regex matches `</div>\s*))}\s*</div>`. That's TWO `</div>`s.
// One is `card-summary`, one is `cards-grid`.
// So we replace it with `</div>\n                    )}\n                  />` (One `</div>` for `card-summary`, and `/>` for `VirtuosoGrid`)
// Let's do exactly this!

c = c.replace(/<\/div>\s*\}\)\}\s*<\/div>/g, "</div>\n                    )}\n                  />");

fs.writeFileSync('src/components/modals/CreatorHub.tsx', c);
