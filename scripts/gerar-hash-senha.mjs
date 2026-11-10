#!/usr/bin/env node
import bcrypt from "bcryptjs";

const email = process.argv[2] || "admin@brigadas.org";
const senha = process.argv[3] || "senha123";
const nome = process.argv[4] || "Administrador";

const hash = bcrypt.hashSync(senha, 10);

console.log("\n=======================================================");
console.log("SQL PARA INSERÇÃO MANUAL DE ADMINISTRADOR NO BANCO:");
console.log("=======================================================\n");
console.log(`INSERT INTO public.admins (nome, email, senha_hash)
VALUES ('${nome.replace(/'/g, "''")}', '${email.toLowerCase().replace(/'/g, "''")}', '${hash}');`);
console.log("\n=======================================================\n");
