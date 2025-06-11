// ...
app.use(cors());

// Servir o frontend (JS e CSS)
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Rota para servir o index.html da raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));

});
