import 'bootstrap/dist/css/bootstrap.min.css'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/esm/Button';
import Alert from 'react-bootstrap/Alert'
import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import axiosInstance from '../api/axiosConfig';
import {Link, useNavigate} from 'react-router-dom'

function Login() {
    const {register, handleSubmit, reset, watch, formState:{errors}} = useForm()
    const [errorAlertVisible, setErrorAlertVisible] = useState(false)
    const [errorAlertText, setErrorAlertText] = useState()
    const nav = useNavigate()

    useEffect(()=>{
        if (localStorage.getItem('loggedInAs')) {
            nav('/dashboard')
        }
    },[])

    async function onSubmit(data) {
        axiosInstance.post('/api/login', data).then(res=>{
            // console.log(res.data);
            localStorage.setItem('loggedInAs', JSON.stringify(res.data))
            nav('/dashboard')
        }).catch(err=>{
            console.log(err.response.data)
            setErrorAlertText(err.response.data)
            setErrorAlertVisible(true)
            setTimeout(()=>setErrorAlertVisible(false), 3000)
        })
    }
    
    return ( <>
    <Container className='container-sm min-vh-100 d-flex align-items-center flex-column justify-content-center'>
        <h1>Login</h1>
        <Container id='formContainer' className='w-50'>
            <Form onSubmit={handleSubmit(onSubmit)} className='mb-3'> 
                <Form.Group className='mb-3'>
                    <Form.Label>Email address</Form.Label>
                    <Form.Control maxLength={255} {...register('email', {required:true})} required className='border border-dark' type="email" placeholder="Enter email" />
                </Form.Group>

                <Form.Group className='mb-3'>
                    <Form.Label>Password</Form.Label>
                    <Form.Control maxLength={255} {...register('password', {required:true})} required className='border border-dark' type="password" placeholder="Enter password" />
                </Form.Group>
                <Button type='submit' className='mb-3'>Login</Button>
                <p>Have an account already? <Link to="/signup">Signup</Link></p>
            </Form>
            {errorAlertVisible && <Alert className='alert-danger'>{errorAlertText}</Alert>}
        </Container>
    </Container>
    </> );
}

export default Login;