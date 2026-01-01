export default function Home() {
  return (
    <main style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Quick Note - ChatGPT App</h1>
      <p style={{ marginTop: "16px", color: "#666" }}>
        Bu uygulama ChatGPT içinde çalışmak üzere tasarlanmıştır.
      </p>
      <div style={{ marginTop: "24px", padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
        <h3>MCP Server Durumu</h3>
        <p>Endpoint: <code>/mcp</code></p>
        <p style={{ marginTop: "8px" }}>
          ChatGPT&apos;de Developer Mode&apos;u açın ve bu URL&apos;yi connector olarak ekleyin.
        </p>
      </div>
    </main>
  );
}
