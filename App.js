import { StyleSheet, Text, View, Image, ImageBackground, SectionList, TouchableOpacity } from "react-native"
import dados from "./assets/dados.json"
import { formatarData } from "./utils/DateFormat.js"
import DiaCard from "./components/DiaCard.jsx"
import { useEffect, useState } from "react"
import { supabase } from "./utils/supabase"

export default function App() {
  const [jogos, setJogos] = useState([])
  const [erroCarregamento, setErroCarregamento] = useState(false)

useEffect(() => {
    async function carregarJogos() {
      const { data, error } = await supabase.from("jogos").select("*").order("data_brasilia", { ascending: false })

      if (!error) {
        setJogos(data)
      }else {
        setErroCarregamento(true)
      }
    }

    carregarJogos()
  }, [])

  const [grupoSelecionado, setGrupoSelecionado] = useState("TODOS")

  const grupos = ["TODOS", ...new Set(jogos.map((jogo) => jogo.grupo))]
  grupos.sort((a, b) => {
    if (a === "TODOS") {
      return -1
    }
    if (b === "TODOS") {
      return 1
    }
    return a.localeCompare(b)
  })

  const jogosFiltrados = grupoSelecionado === "TODOS" ? jogos : jogos.filter((jogo) => jogo.grupo === grupoSelecionado)

  const agruparPorData = (jogos) => {
    return jogos.reduce((acc, jogo) => {
      const data = formatarData(jogo.data_brasilia)

      if (!acc[data]) {
        acc[data] = []
      }

      acc[data].push(jogo)

      return acc
    }, {})
  }

  const jogosOrdenados = [...jogosFiltrados].sort((a, b) => {
    return (
      new Date(`${a.data_brasilia} ${a.hora_brasilia}`) -
      new Date(`${b.data_brasilia} ${b.hora_brasilia}`)
    )
  })

  const jogosAgrupados = agruparPorData(jogosOrdenados)

  const jogosTratados = Object.keys(jogosAgrupados).map((data) => {
    return {
      title: data,
      data: jogosAgrupados[data],
    }
  })

  return (
    <ImageBackground
      style={styles.container}
      source={require("./assets/bg-overlay.png")}
    >
      <Image style={styles.logo} source={require("./assets/unicopa.png")} />

      <Text style={styles.title}>CALENDÁRIO</Text>

      <View style={styles.filtrosContainer}>
        {grupos.map((grupo) => {
          const ativo = grupoSelecionado === grupo

          return (
            <TouchableOpacity
              key={grupo}
              style={[styles.botaoFiltro, ativo && styles.botaoFiltroAtivo]}
              onPress={() => setGrupoSelecionado(grupo)}
            >
              <Text
                style={[styles.textoFiltro, ativo && styles.textoFiltroAtivo]}
              >
                {grupo}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    {erroCarregamento ? (
      <Text style={styles.erro}>Erro ao carregar os jogos.</Text>
    ) : (
      <SectionList
        sections={jogosTratados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={() => null}
        renderSectionHeader={({ section }) => (
          <DiaCard data={section.title} jogos={section.data} />
        )}
      />)}
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%",
    backgroundColor: "#040b13",
    alignItems: "center",
  },
  logo: {
    marginTop: 20,
    width: 200,
    height: 50,
    resizeMode: "contain",
  },
  title: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "700",
    color: "white",
  },
  filtrosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  botaoFiltro: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#0c1b2a",
    borderWidth: 1,
    borderColor: "#1e2d3d",
  },
  botaoFiltroAtivo: {
    backgroundColor: "#f2cc2f",
  },
  textoFiltro: {
    color: "white",
    fontWeight: "600",
  },
  textoFiltroAtivo: {
    color: "#040b13",
  },
  card: {
    marginTop: 20,
    backgroundColor: "#0c1b2a",
    width: 320,
    borderRadius: 12,
    padding: 15,
  },
  data: {
    color: "#f2cc2f",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  erro: {
    marginTop: 20,
    color: "red",
    fontSize: 16,
    fontWeight: "600",
  },
})
