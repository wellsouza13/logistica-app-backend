// src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta_forte';

export const register = async (req: Request, res: Response) => {
  try {
    const { matricula, senha } = req.body;

    if (!matricula || !senha) {
      return res.status(400).json({ success: false, message: 'Matrícula e senha são obrigatórios.' });
    }

    // Verifica se matrícula já existe
    const existingUser = await prisma.user.findUnique({
      where: { matricula },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Matrícula já cadastrada.' });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Cria usuário
    const newUser = await prisma.user.create({
      data: {
        matricula,
        senha: hashedPassword,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso.',
      user: {
        id: newUser.id,
        matricula: newUser.matricula,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { matricula, senha } = req.body;

    const user = await prisma.user.findUnique({
      where: { matricula },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ success: false, message: 'Senha inválida.' });
    }

    const token = jwt.sign(
      { id: user.id, matricula: user.matricula },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      message: 'Login bem-sucedido!',
      token,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
  }
};
