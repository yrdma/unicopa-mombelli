import { useState } from "react"
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ImageBackground, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { supabase } from "../utils/supabase"

export default function Registro({ aoVoltar }) {
    const [nome, setNome] = useState("")
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [confirmarSenha, setConfirmarSenha] = useState("")

    const [loading, setLoading] = useState(false)
    const [erro, setErro] = useState("")
    const [sucesso, setSucesso] = useState("")

    async function handleCadastro() {
        setErro("")
        setSucesso("")

        if (!email || !senha || !confirmarSenha) {
            setErro("E-mail e senhas são obrigatórios.")
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setErro("Por favor, insira um e-mail válido.")
            return
        }

        if (senha.length < 6) {
            setErro("A senha deve ter pelo menos 6 caracteres.")
            return
        }

        if (senha !== confirmarSenha) {
            setErro("As senhas não coincidem.")
            return
        }

        setLoading(true)

        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: senha,
            options: {
                data: {
                    nome_completo: nome
                }
            }
        })

        if (error) {
            setErro("Erro ao cadastrar: " + error.message)
            setLoading(false)
            return
        }

        setLoading(false)

        if (data?.session) {
            setSucesso("Conta criada com sucesso! Entrando...")
            aoVoltar()
        } else {
            setSucesso("Conta criada com sucesso! Faça seu login.")
        }
    }

    return (
        <ImageBackground
            style={styles.background}
            source={require("../assets/bg-overlay.png")}
            resizeMode="cover"
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Image style={styles.logo} source={require("../assets/unicopa.png")} />

                    <View style={styles.card}>
                        <Text style={styles.title}>Criar Conta</Text>

                        {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}
                        {sucesso ? <Text style={styles.textoSucesso}>{sucesso}</Text> : null}

                        {!sucesso && (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nome (Opcional)"
                                    placeholderTextColor="#8fa3b8"
                                    autoCapitalize="words"
                                    value={nome}
                                    onChangeText={setNome}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Seu E-mail"
                                    placeholderTextColor="#8fa3b8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Crie uma Senha"
                                    placeholderTextColor="#8fa3b8"
                                    secureTextEntry
                                    value={senha}
                                    onChangeText={setSenha}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirme a Senha"
                                    placeholderTextColor="#8fa3b8"
                                    secureTextEntry
                                    value={confirmarSenha}
                                    onChangeText={setConfirmarSenha}
                                />

                                <TouchableOpacity
                                    style={styles.botao}
                                    onPress={handleCadastro}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#040b13" />
                                    ) : (
                                        <Text style={styles.textoBotao}>CADASTRAR</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity style={styles.botaoVoltar} onPress={aoVoltar}>
                            <Text style={styles.textoBotaoVoltar}>
                                {sucesso ? "Voltar ao Login" : "Já tem uma conta? Entrar"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    background: {
        height: "100%",
        width: "100%",
        backgroundColor: "#040b13",
    },
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
    },
    logo: {
        width: 200,
        height: 60,
        resizeMode: "contain",
        marginBottom: 40,
    },
    card: {
        backgroundColor: "#0c1b2a",
        width: "90%",
        maxWidth: 400,
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: "#1e2d3d",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "white",
        marginBottom: 24,
        textAlign: "center",
    },
    input: {
        backgroundColor: "#040b13",
        color: "white",
        borderWidth: 1,
        borderColor: "#1e2d3d",
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        fontSize: 16,
    },
    botao: {
        backgroundColor: "#f2cc2f",
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    textoBotao: {
        color: "#040b13",
        fontWeight: "bold",
        fontSize: 16,
    },
    botaoVoltar: {
        marginTop: 20,
        alignItems: "center",
        padding: 10,
    },
    textoBotaoVoltar: {
        color: "#8fa3b8",
        fontSize: 15,
        textDecorationLine: "underline",
    },
    textoErro: {
        color: "#ff6b6b",
        marginBottom: 15,
        textAlign: "center",
        fontWeight: "600",
    },
    textoSucesso: {
        color: "#4cd137",
        marginBottom: 20,
        textAlign: "center",
        fontWeight: "600",
        fontSize: 16,
        lineHeight: 22,
    },
})