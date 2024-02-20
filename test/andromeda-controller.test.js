import express from 'express';
import request from 'supertest';
const app = express();

describe('POST Create User Page', () => {
    it('should create page for the user', () => {
        request(app)
        .get('user/home')
        .send({})
        .expect(201)
        .then((res) => {
            console.log(res);
         expect(res.headers.location).to.be.eql('123456/wallet');
        });
    });
});