import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
  questoesRespondidas: [
    {
      questaoId: Number,
      enunciado: String,
      respostaUsuario: String,
      correta: Boolean,
      explicacao: String,
      materia: String,
      topico: String,
      fonte: String,
      estilo: String,
      respondidoEm: Date,
    },
  ],
  desempenho: {
    totalAcertos: Number,
    totalErros: Number,
    percentualAcerto: Number,
    porMateria: {
      type: Map,
      of: {
        acertos: Number,
        erros: Number,
      },
    },
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
