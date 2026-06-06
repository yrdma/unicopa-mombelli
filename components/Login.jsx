import { useState } from "react"
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ImageBackground, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { supabase } from "../utils/supabase"
import Registro from "./Cadastro"

export default function Login() {
    const [mostrarRegistro, setMostrarRegistro] = useState(false) 
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [loading, setLoading] = useState(false)
    const [erro, setErro] = useState("")

    async function handleLogin() {
        setErro("")

        if (!email || !senha) {
            setErro("Preencha todos os campos obrigatórios.")
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setErro("Por favor, insira um e-mail válido.")
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: senha,
        })

        if (error) {
            setErro("E-mail ou senha incorretos. Tente novamente.")
            setLoading(false)
            return
        }

        setLoading(false)
    }

    if (mostrarRegistro) {
        return <Registro aoVoltar={() => setMostrarRegistro(false)} />
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
                        <Text style={styles.title}>Acessar Conta</Text>

                        {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}

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
                            placeholder="Sua Senha"
                            placeholderTextColor="#8fa3b8"
                            secureTextEntry
                            value={senha}
                            onChangeText={setSenha}
                        />

                        <TouchableOpacity
                            style={styles.botao}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#040b13" />
                            ) : (
                                <Text style={styles.textoBotao}>ENTRAR</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.botaoVoltar} 
                            onPress={() => setMostrarRegistro(true)}
                        >
                            <Text style={styles.textoBotaoVoltar}>
                                Não tem uma conta? Cadastre-se
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
})