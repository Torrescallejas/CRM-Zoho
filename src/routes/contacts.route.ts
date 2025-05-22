import { Router } from "express";
import { callback, createContact, getContacts, login } from "../controllers/contact.controller";

const router = Router();

router
    .get('/login', login)
    .get('/callback', callback)
    .get('/contacts', getContacts)
    .post('/contact/create', createContact)

export default router;