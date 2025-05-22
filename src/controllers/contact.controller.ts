import { Request, Response } from "express";
import axios from "axios";

import dotenv from 'dotenv';
dotenv.config();

// ⚙️ Configura tus credenciales de Zoho
const CLIENT_ID = process.env.CLIENT_ID || 'CLIENT_ID';
const CLIENT_SECRECT = process.env.CLIENT_SECRECT || 'CLIENT_SECRET';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/callback';
const ZOHO_AUTH_URL = `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.contacts.ALL&client_id=${CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${REDIRECT_URI}`;

export async function login(_req: Request, res: Response): Promise<any> {
    return res.redirect(ZOHO_AUTH_URL);
};

//Callback
export async function callback(req: Request, res: Response): Promise<any> {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'No se recibió el código de autorización' });
    }

    try {
        const tokenResponse = await axios.post(
            'https://accounts.zoho.com/oauth/v2/token',
            null,
            {
                params: {
                    grant_type: 'authorization_code',
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRECT,
                    redirect_uri: REDIRECT_URI,
                    code,
                },
            }
        );

        // console.log(tokenResponse)
        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        console.log('✅ ACCESS TOKEN:', access_token);
        console.log('🔁 REFRESH TOKEN:', refresh_token);
        console.log('⏳ Expira en:', expires_in, 'segundos');

        res.json({
            message: 'Autenticación exitosa con Zoho CRM',
            access_token,
            refresh_token,
        });
    } catch (error: any) {
        console.error('Error al obtener el token:', error.response?.data || error.message);
        res.status(500).json({ error: 'Fallo al intercambiar el código por token' });
    }
};

//Get Contacts
export async function getContacts(_req: Request, res: Response): Promise<any> {
    try {
        const oauth = _req.headers['zoho-oauthtoken']

        const response = await axios.get('https://www.zohoapis.com/crm/v3/Contacts?fields=First_Name,Last_Name,id', {
            headers: {
                Authorization: `Zoho-oauthtoken ${oauth}`,
            },
        });

        return res.json(response.data);
    } catch (error: any) {
        console.error('Error al obtener contactos:', error.response?.data || error.message);
        return res.status(500).json({
            error: 'Error al obtener los contactos',
            details: error.response?.data || error.message,
        });
    }
};


export async function createContact(req: Request, res: Response): Promise<any> {
    const { first_name, last_name } = req.body;

    //Validation
    if (!first_name || !last_name) {
        return res.status(400).json({ error: 'Se requieren first_name y last_name' });
    }

    const oauth = req.headers['zoho-oauthtoken']

    try {
        const response = await axios.post(
            'https://www.zohoapis.com/crm/v3/Contacts',
            {
                data: [
                    {
                        First_Name: first_name,
                        Last_Name: last_name,
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${oauth}`,
                },
            }
        );

        return res.status(200).json({
            message: 'Contacto creado exitosamente en Zoho CRM',
            data: response.data.data,
        });
    } catch (error: any) {
        console.error('Error al crear contacto:', error.response?.data || error.message);
        return res.status(500).json({
            error: 'Error al crear el contacto en Zoho CRM',
            details: error.response?.data || error.message,
        });
    }
};