const mkArc = (usage) => {
      const cos = Math.cos;
      const sin = Math.sin;
      const pi = Math.PI;
      const f_matrix_times = (( [[a,b], [c,d]], [x,y]) => [ a * x + b * y, c * x + d * y]);
      const f_rotate_matrix = (x => [[cos(x),-sin(x)], [sin(x), cos(x)]]);
      const f_vec_add = (([a1, a2], [b1, b2]) => [a1 + b1, a2 + b2]);
      const f_svg_ellipse_arc = (([cx,cy],[rx,ry], [t1, delta], base ) => {
        delta = delta % (2*pi);
        const rotMatrix = f_rotate_matrix (base);
        const [sX, sY] = ( f_vec_add ( f_matrix_times ( rotMatrix, [rx * cos(t1), ry * sin(t1)] ), [cx,cy] ) );
        const [eX, eY] = ( f_vec_add ( f_matrix_times ( rotMatrix, [rx * cos(t1+delta), ry * sin(t1+delta)] ), [cx,cy] ) );
        const fA = ( (  delta > pi ) ? 1 : 0 );
        const fS = ( (  delta > 0 ) ? 1 : 0 );
        const path_2wk2r = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path_2wk2r.setAttribute("d", "M " + sX + " " + sY + " A " + [ rx , ry , base / (2*pi) *360, fA, fS, eX, eY ].join(" "));
        return path_2wk2r;
      });
      return f_svg_ellipse_arc([22, 22], [18, 18], [3 * pi/2, (1 - usage) * 2 * pi], 0).outerHTML;
    };
    const getRating = (p) => (
      p.data.rating
    );
    const uncase = (s) => (
      s.replaceAll('_', ' ').split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ').replace('Game And Watch', 'Mr. Game & Watch').replace('Dr', 'Dr.')
    );
    const isBanned = (cc) => {
      return { 'HERO#147': true, 'MEKK#251': true, 'NOFL#113': true }[cc];
    };

// Fetch data from data.json
fetch('data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    // Process the fetched data
    const players = Object.values(data)
      .filter(p => p.tag) // Ensure the player has a tag
      .filter(p => !isBanned(p.tag)) // Filter out banned players
      .map(p => {
        const wins = p.wins || 0;
        const losses = p.losses || 0;
        const totalGames = wins + losses;
        let rating = p.rating;

        // Adjust rating for players with fewer than 5 games
        if (totalGames < 5) {
          rating = -1;
        }

        return { ...p, rating, totalGames };
      });

    // Sort players by rating in descending order
    players.sort((p1, p2) => p2.rating - p1.rating);

    const rows = players.map((p, i) => {
      const isRanked = p.rating > 0;
      const slippiLink = `https://slippi.gg/user/${p.tag.replace('#', '-')}`;
      const chars = p.characters || [];
      const games = p.totalGames;
      const rankStr = games === 0 ? 'Unranked' : (
        games < 5 ? 'Pending' : (
          (p.rating >= 2191.75 && isTop) ? 'Grandmaster' : (
            p.rating >= 2350.00 ? 'Master 3' : (
              p.rating >= 2275.00 ? 'Master 2' : (
                p.rating >= 2191.75 ? 'Master 1' : (
                  p.rating >= 2136.28 ? 'Diamond 3' : (
                    p.rating >= 2073.67 ? 'Diamond 2' : (
                      p.rating >= 2003.92 ? 'Diamond 1' : (
                        p.rating >= 1927.03 ? 'Platinum 3' : (
                          p.rating >= 1843.00 ? 'Platinum 2' : (
                            p.rating >= 1751.83 ? 'Platinum 1' : (
                              p.rating >= 1653.52 ? 'Gold 3' : (
                                p.rating >= 1548.07 ? 'Gold 2' : (
                                  p.rating >= 1435.48 ? 'Gold 1' : (
                                    p.rating >= 1315.75 ? 'Silver 3' : (
                                      p.rating >= 1188.88 ? 'Silver 2' : (
                                        p.rating >= 1054.87 ? 'Silver 1' : (
                                          p.rating >= 913.72 ? 'Bronze 3' : (
                                            p.rating >= 765.43 ? 'Bronze 2' : (
                                              'Bronze 1'
      ))))))))))))))))))));

      const charsHtml = chars.map((character, index) => {
        const usage = p.percentages[index] / 100 || 0;
        const charName = uncase(character);
        const perc = Math.round(usage * 1000) / 10;
        const label = `${charName} (${perc}%)`;
        return `
          <div class="tooltip" tabindex="0" style="position: relative; width: 44px; height: 44px; margin-right: 4px;" >
            <svg
              width="44"
              height="44"
            >
              <circle stroke="#2ECC40" stroke-width="4" fill="transparent" r="18" cx="22" cy="22" />
              ${mkArc(usage)}
            </svg>
            <img
              alt="${label}"
              aria-label="${label}"
              src="../resources/chars/${character}.png"
            />
            <div class="tooltiptext">${label}</div>
          </div>
        `;
      });

      const extra = chars.length - charsHtml.length;
      const extraHtml = extra === 0 ? '' : `
        <div class="extra">
          +${extra}
          <svg
            width="44"
            height="44"
          >
            <circle
              stroke="#9298a040"
              stroke-width="2"
              stroke-dasharray="8"
              fill="transparent"
              r="20"
              cx="22"
              cy="22"
            />
          </svg>
        </div>
      `;

      const rankHtml = `
        <img
          alt="${rankStr}"
          aria-label="${rankStr}"
          src="../resources/ranks/${rankStr}.svg"
        />
        <div class="tooltiptext">${rankStr}</div>
      `;

      return `
        <tr>
          <td class="stuck" style="position: sticky; width: 30px;" >
            ${isRanked ? i + 1 : '-'}
          </td>
          <td class="stuck edge right-pad" style="text-align: left; position: sticky;" >
            <a target="_blank" href="${slippiLink}">
              <p>${p.name}</p>
              <p>${p.tag}</p>
            </a>
          </td>
          <td class="left-pad-sm right-pad" style="text-align: left;">
            <div style="display: flex; flex-direction: row;" >
              ${charsHtml.join('')}
              ${extraHtml}
            </div>
          </td>
          <td class="left-pad right-pad">${isRanked ? (Math.round(p.rating * 10) / 10) : '-'}</td>
          <td class="ranktooltip left-pad right-pad" tabindex="0">
            ${rankHtml}
          </td>
          <td class="left-pad right-pad">
            <span>${p.wins}</span>
            <span>/</span>
            <span>${p.losses}</span>
          </td>
        </tr>
      `;
    });

    document.getElementById('data').innerHTML = `
      <thead>
        <tr>
          <th class="stuck" style="position: sticky; width: 30px;" >#</th>
          <th class="stuck edge right-pad" style="text-align: left; position: sticky;">PLAYER</th>
          <th class="left-pad-sm right-pad" style="text-align: left;">CHARACTERS</th>
          <th>RATING</th>
          <th>RANK</th>
          <th>W / L</th>
        </tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    `;
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });