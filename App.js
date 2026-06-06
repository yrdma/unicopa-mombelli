import { StyleSheet, Text, View, Image, ImageBackground, SectionList, TouchableOpacity } from "react-native"
import { useEffect, useState } from "react"
import { formatarData } from "./utils/DateFormat.js"
import DiaCard from "./components/DiaCard.jsx"
import { supabase } from "./utils/supabase"
import Login from "./screens/Login.jsx"
import Palpites from "./screens/Palpites.jsx"
import MeusPalpites from "./screens/MeusPalpites.jsx"

export default function App() {
  const [session, setSession] = useState(null)
  const [jogos, setJogos] = useState([])
  const [erroCarregamento, setErroCarregamento] = useState(false)
  const [grupoSelecionado, setGrupoSelecionado] = useState("TODOS")
  const [telaAtiva, setTelaAtiva] = useState("CALENDARIO") // CALENDARIO | PALPITES | HISTORICO

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    async function carregarJogos() {
      const { data, error } = await supabase.from("jogos").select("*").order("data_brasilia", { ascending: false })

      if (!error) {
        setJogos(data)
      } else {
        setErroCarregamento(true)
      }
    }

    if (session) {
      carregarJogos()
    }
  }, [session])

  if (!session) {
    return <Login />
  }

  const userId = session.user.id

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

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
      
    if (error) {
      console.error("Erro ao fazer logout:", error.message)
    }
  }

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

      {/* abasContainer atualizado para 3 opções simétricas e responsivas */}
      <View style={styles.abasContainer}>
        <TouchableOpacity 
          style={[styles.abaBotao, telaAtiva === "CALENDARIO" && styles.abaBotaoAtiva]} 
          onPress={() => setTelaAtiva("CALENDARIO")}
        >
          <Text style={[styles.abaTexto, telaAtiva === "CALENDARIO" && styles.abaTextoAtiva]}>JOGOS</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.abaBotao, telaAtiva === "PALPITES" && styles.abaBotaoAtiva]} 
          onPress={() => setTelaAtiva("PALPITES")}
        >
          <Text style={[styles.abaTexto, telaAtiva === "PALPITES" && styles.abaTextoAtiva]}>PALPITAR</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.abaBotao, telaAtiva === "HISTORICO" && styles.abaBotaoAtiva]} 
          onPress={() => setTelaAtiva("HISTORICO")}
        >
          <Text style={[styles.abaTexto, telaAtiva === "HISTORICO" && styles.abaTextoAtiva]}>MEUS PALPITES</Text>
        </TouchableOpacity>
      </View>

      {/* Renderização Condicional das Telas baseada no estado ativo */}
      {telaAtiva === "CALENDARIO" && (
        <>
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
                <DiaCard 
                  data={section.title} 
                  jogos={section.data} 
                  userId={userId} 
                />
              )}
            />
          )}
        </>
      )}

      {telaAtiva === "PALPITES" && (
        <Palpites userId={userId} />
      )}

      {telaAtiva === "HISTORICO" && (
        <MeusPalpites userId={userId} />
      )}

      <TouchableOpacity 
        style={styles.botaoSair} 
        onPress={handleLogout}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>SAIR DA CONTA</Text>
      </TouchableOpacity>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#040b13",
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 45,
    marginTop: 20,
    resizeMode: "contain",
  },
  abasContainer: {
    flexDirection: "row",
    width: "90%",
    marginTop: 15,
    padding: 4,
    backgroundColor: "#0c1b2a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1e2d3d",
  },
  abaBotao: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 6,
  },
  abaBotaoAtiva: {
    backgroundColor: "#1e2d3d",
  },
  abaTexto: {
    color: "#8fa3b8",
    fontSize: 12, // Um leve ajuste para caber perfeitamente em 3 colunas em qualquer tela
    fontWeight: "700",
  },
  abaTextoAtiva: {
    color: "#f2cc2f",
  },
  filtrosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
    gap: 8,
  },
  botaoFiltro: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#0c1b2a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e2d3d",
  },
  botaoFiltroAtivo: {
    backgroundColor: "#f2cc2f",
  },
  textoFiltro: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  textoFiltroAtivo: {
    color: "#040b13",
  },
  erro: {
    marginTop: 20,
    color: "red",
    fontSize: 16,
    fontWeight: "600",
  },
  botaoSair: {
    width: "90%",
    alignSelf: "center",
    marginVertical: 15,
    padding: 12,
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    alignItems: "center",
  },
})