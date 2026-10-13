export function publicPlayer(player: Record<string, unknown>) {
  return {
    id: player.id,
    name: player.name,
    shirtNumber: player.shirt_number,
    position: player.position,
  };
}
export function publicTeam(
  team: Record<string, unknown>,
  players: Record<string, unknown>[] = [],
) {
  return {
    id: team.id,
    name: team.team_name,
    players: players.map(publicPlayer),
  };
}
