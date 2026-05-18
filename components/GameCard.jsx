import { StyleSheet, Text, View, Image } from 'react-native'
import { TEAM_FLAGS } from '../utils/flagMapping'

export default function GameCard({ game }) {
  const timeCasa = TEAM_FLAGS[game.sigla_casa]
  const timeFora = TEAM_FLAGS[game.sigla_fora]

  const isBrazil = game.sigla_casa === 'BRA' || game.sigla_fora === 'BRA'


  return (
    <View style={[styles.jogo, isBrazil && styles.jogoBrasil]}>

      <Text style={styles.grupo}>
        GRUPO {game.grupo}  {game.confronto}
      </Text>

      <View style={styles.linhaPrincipal}>

        <View style={styles.time}>
          {timeCasa && <Image source={timeCasa} style={styles.bandeira} />}
          <Text style={styles.sigla}>{game.sigla_casa}</Text>
        </View>

        <View style={styles.horario}>
          <Text style={styles.hora}>{game.hora_brasilia}</Text>
          <Text style={styles.subTitulo}>VS</Text>
        </View>

        <View style={styles.time}>
          {timeFora && <Image source={timeFora} style={styles.bandeira} />}
          <Text style={styles.sigla}>{game.sigla_fora}</Text>
        </View>

      </View>

      <View style={styles.local}>
        <Text style={styles.subTitulo}>{game.estadio}</Text>
        <Text style={styles.subTitulo}>
          {game.cidade} • {game.pais}
        </Text>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  jogo: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2d3d',
    paddingBottom: 15
  },
  grupo: {
    color: '#8fa3b8',
    fontSize: 12,
    marginBottom: 10
  },
  linhaPrincipal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  bandeira: {
    width: 28,
    height: 28,
    borderRadius: 14
  },
  sigla: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  horario: {
    alignItems: 'center'
  },
  hora: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  local: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  subTitulo: {
    color: '#8fa3b8',
    fontSize: 12
  },
  jogoBrasil: {
    backgroundColor: '#16351f'
  },

})