import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/esm/Button";
import Table from 'react-bootstrap/Table'
import axiosInstance from '../api/axiosConfig';
import TimeAgo from 'timeago-react'
import 'bootstrap-icons/font/bootstrap-icons.css'
import Alert from 'react-bootstrap/Alert'

function Dashboard() {
    const [alertText, setAlertText] = useState('Alert')
    const [alertVisible, setAlertVisible] = useState(false)
    const [alertVariant, setAlertVariant] = useState()
    const [email, setEmail] = useState()
    const [users, setUsers] = useState([])
    const nav = useNavigate()

    const showAlert = (text, time = 3000, variant = 'success')=>{
        setAlertVariant(variant)
        setAlertText(text)
        setAlertVisible(true)
        setTimeout(()=>setAlertVisible(false), time)
    }

    const updateUsers =()=>{
        axiosInstance.get('/api/users').then(res=>{
            setUsers(res.data)
        })
    }

    const checkAuth = async (em) => {((await userIsAuthorized(em)) == false) ? logout() : updateLastActive(em)}
    const checkAuthNoUPD = async (em) => {if ((await userIsAuthorized(em)) == false) logout()}

    useEffect(()=>{
        if (localStorage.getItem('loggedInAs')) {
            const loggedInAs = JSON.parse(localStorage.getItem('loggedInAs'))
            setEmail(loggedInAs.email)
            checkAuth(loggedInAs.email)
            updateUsers()
        }else{
            logout()
        }
    }, [])

    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedUsers(new Set());
        } else {
            const allIds = users.map(el => el.id);
            setSelectedUsers(new Set(allIds));
        }
        setSelectAll(!selectAll);
    };
    const deselectAll = ()=>{
        setSelectedUsers(new Set());
        setSelectAll(false);
    }

    const toggleRow = (id) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedUsers(newSelected);
        setSelectAll(newSelected.size === users.length);
    };

    const updateLastActive = async (email)=>{
        axiosInstance.patch('/api/updateLastActive', {email:email})
    }

    const userIsAuthorized = async (email)=>{
        let isAuth = true 
        await axiosInstance.get(`/api/userIsAuthorized?email=${email}`).catch(err=>{
            isAuth = false
        })
        return isAuth
    }

    const logout = ()=>{
        localStorage.removeItem('loggedInAs')
        nav('/login')
    }

    const prepForAction = async ()=>{
        updateLastActive(email)
        const isAuthorized = await userIsAuthorized(email)
        if (!isAuthorized) {
            logout()
        }
    }

    const blockUsers = ()=>{
        prepForAction()
        if (selectedUsers.size > 0){
            axiosInstance.patch('/api/blockUsers', {users: [...selectedUsers]}).then(res=>{
                updateUsers()
                checkAuthNoUPD(email)
                showAlert('Users blocked')
            })
        }
    }
    const unblockUsers = ()=>{
        prepForAction()
        if (selectedUsers.size > 0){
            axiosInstance.patch('/api/unblockUsers', {users: [...selectedUsers]}).then(res=>{
                updateUsers()
                checkAuthNoUPD(email)
                showAlert('Users unblocked')
            })
        }
    }
    const deleteUsers = ()=>{
        prepForAction()
        if (selectedUsers.size > 0){
            axiosInstance.delete(`/api/deleteUsers?users=${JSON.stringify([...selectedUsers])}`).then(res=>{
                updateUsers()
                checkAuthNoUPD(email)
                showAlert('Users deleted')
                deselectAll()
            })
        }
    }
    const deleteUnverifiedUsers = ()=>{
        prepForAction()
        axiosInstance.delete(`/api/deleteUnverifiedUsers`).then(res=>{
            updateUsers()
            checkAuthNoUPD(email)
            showAlert('Users deleted')
            deselectAll()
        })
    }
    
    return ( <>

    {alertVisible && <Container className="position-absolute top-0 start-50 translate-middle-x w-25">
        <Alert className="text-center" variant={alertVariant}>{alertText}</Alert>
    </Container>}

    <Button variant="danger"onClick={()=>logout()} className="position-absolute top-0 end-0 m-3">Logout</Button>

    <header>
        <Container className="m-1 mt-3 ms-3">
            <div className="d-flex gap-1 flex-wrap ">
                <Button onClick={()=>blockUsers(selectedUsers)} variant="outline-primary border-2"><i className="bi bi-lock"></i> Block</Button>
                <Button onClick={()=>unblockUsers(selectedUsers)}><i className="bi bi-unlock"></i></Button>
                <Button onClick={()=>deleteUsers(selectedUsers)} variant="danger"><i className="bi bi-trash3"></i></Button>
                <Button onClick={()=>deleteUnverifiedUsers()} variant="danger"><i className="bi bi-patch-check"></i></Button>
            </div>
        </Container>
    </header>
    <Container className="m-0 mt-3 w-100">
        <Table className="w-100 table-hover">
            <thead>
                <tr>
                    <th className="text-center">
                        <input type="checkbox" checked={selectAll} onChange={toggleSelectAll}/>
                    </th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Last active</th>
                </tr>
            </thead>
            <tbody>
                {users.map(el=>(
                    <tr key={el.id}>
                        <td className="text-center">
                            <input type="checkbox" checked={selectedUsers.has(el.id)} onChange={() => toggleRow(el.id)} />
                        </td>
                        <td className="text-wrap"><p>{el.name}</p></td>
                        <td className="text-wrap">{el.email}</td>
                        <td>{el.status}</td>
                        <td data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title={new Date(el.last_active).toString().split('GMT')[0]}
                        >
                            <TimeAgo datetime={el.last_active}></TimeAgo>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    </Container>
    </> );
}

export default Dashboard;