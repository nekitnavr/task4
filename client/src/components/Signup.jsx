import 'bootstrap/dist/css/bootstrap.min.css'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/esm/Button';
import Alert from 'react-bootstrap/Alert'
import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import axiosInstance from '../api/axiosConfig';
import {Link, useNavigate} from 'react-router-dom'

function Signup() {
    const {register, handleSubmit, reset, watch, formState:{errors}} = useForm()
    const [successAlertVisible, setSuccessAlertVisible] = useState(false)
    const [errorAlertVisible, setErrorAlertVisible] = useState(false)
    const [errorAlertText, setErrorAlertText] = useState()
    const nav = useNavigate('/dashboard')

    useEffect(()=>{
        if (localStorage.getItem('loggedInAs')) {
            nav('/dashboard')
        }
    },[])

    async function onSubmit(data) {
        axiosInstance.post('/api/createUser', data).then(res=>{
            setSuccessAlertVisible(true)
            setTimeout(()=>setSuccessAlertVisible(false), 3000)
        }).catch(err=>{
            console.log(err.response);
            setErrorAlertText(err.response.data)
            setErrorAlertVisible(true)
            setTimeout(()=>setErrorAlertVisible(false), 3000)
        })
    }
    
    return ( <>
    <Container className='container-sm min-vh-100 d-flex align-items-center flex-column justify-content-center'>
        <h1>Sign up</h1>
        <Container id='formContainer' className='w-50'>
            <Form onSubmit={handleSubmit(onSubmit)} className='mb-3'> 
                <Form.Group className='mb-3'>
                    <Form.Label>Email address</Form.Label>
                    <Form.Control {...register('email', {required:true})} required 
                        className='border border-dark' 
                        type="email" placeholder="Enter email"
                        maxLength={255} />
                </Form.Group>
                <Form.Group className='mb-3'>
                    <Form.Label>Name</Form.Label>
                    <Form.Control {...register('name', {required:true})} required 
                        className='border border-dark' 
                        type="text" placeholder="Enter your name"
                        maxLength={255} />
                </Form.Group>
                <Form.Group className='mb-3'>
                    <Form.Label>Password</Form.Label>
                    <Form.Control {...register('password', {required:true})} required 
                        className='border border-dark' 
                        type="password" placeholder="Enter password"
                        maxLength={255} />
                </Form.Group>
                <Button type='submit' className='mb-3'>Signup</Button>
                <p>Have an account already? <Link to="/login">Login</Link></p>
            </Form>
            {successAlertVisible && <Alert className='alert-success'>User created successfully</Alert>}
            {errorAlertVisible && <Alert className='alert-danger'>{errorAlertText}</Alert>}
        </Container>
    </Container>
    </> );
}

export default Signup;