const express      = require('express');
const handlebars   = require('express-handlebars');
const bodyParser   = require('body-parser');
const mongoose     = require("mongoose");
const path         = require('path');
const passport = require('passport');
const localStrategy = require ("passport-local").Strategy;


//## ------------CONFIGURAÇÕES -----------------##

// config express
const app = express()

// config porta do servidor
const portaHttp = 9999;

// config passaport 
passport.use(new localStrategy({usernameField: "email"}, (email,done) =>{
    novoUsuario.findOne({email: email}).then((usuario)=>{
        if(!usuario){
            return done(null, false, {message: "Conta não exite"})
        }
    })
}))

passport.serializeUser((usuario, done) =>{
    done(null, usuario.id)
})

passport.deserializeUser((id,done)=>{
    novoUsuario.findById(id, (err, usuario)=>{
        done (err, usuario )
    })
})

// config handlebars
app.engine('handlebars', handlebars ({
    defaultLayout: 'main'
}));

// Config Body-parser
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// Config MongoDb Mongoose
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/db_base", ).then(() => {
    console.log("Banco Conectado");
}).catch((err) =>{
    console.log("Erro na conexão" + err)
});

// public
app.use(express.static(path.join(__dirname, "public")))

// ######### Model - Eventos ##############
const eventoSchema = mongoose.Schema({
    nome: {
        type: String,
        require: true
    },
    
    local: {
        type: String,
        require: true
    },

    data: {
        type: Date,
        require: true
    },

    horario: {
        type: String,
        require: true

    }
})
 
mongoose.model("eventos", eventoSchema )
const novoEvento = mongoose.model("eventos")

// ######### Model - Usuários ##############
const Usuario = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    email:{
        type: String,
        require: true
    },
    senha: {
        type: String,
        requeired: true
    }
})

mongoose.model("usuarios", Usuario)
const novoUsuario = mongoose.model("usuarios")

//## -------------ROTAS -----------------##

// 01: rota get p renderizar a home
app.get('/', (request,response) => {
    response.render('home.handlebars')
});

// 02: rota get para cadastro 
app.get('/cadastrar', (request,response) => {
    response.render('cadastroUsuario.handlebars')
});

// 03: rota post do formulario de cadastro 
app.post('/cadastrar', (request,response) => {
   var erros = []

   if(!request.body.nomeUser || typeof request.body.nomeUser == undefined || request.body.nomeUser == null){
       erros.push({texto: "Nome Inválido"})
   }

   if(!request.body.emailUser || typeof request.body.emailUser == undefined || request.body.nomeUser == null){
        erros.push({texto: "Email Inválido"})
    
    }

    if(!request.body.senhaUser || typeof request.body.senhaUser == undefined || request.body.nomeUser == null){
        erros.push({texto: "Senha Inválido"})
        
    }

    if(request.body.senhaUser != request.body.senha2User){
        erros.push({texto: "Senhas Diferentes "})
    }

    if(erros.length >0){
        response.render("cadastroUsuario.handlebars", {erros:erros} )
    }else{
        novoUsuario.findOne({email: request.body.email}).then((usuario) =>{
            if(usuario){
                errros.push({texto: "Email já cadastrado"})
                response.render("cadastroUsuario.handlebars", {erros:erros} )
            }else{
                new novoUsuario({
                    nome: request.body.nomeUser,
                    email: request.body.emailUser,
                    senha: request.body.senhaUser
                }).save().then(() =>{
                    response.redirect("/buscarEvento")
                    console.log("user casastrado com sucesso ")

                }).catch((err) => {
                    response.redirect("/cadastrar")
                    console.log("erro ao cadastar user ")
                })

            }
        }).catch((err) =>{
           
        })
    }

});

// 04: rota get para cadastrar evento
app.get('/addEvento', (request,response) => {
    response.render('cadastroEvento.handlebars')
});

// 05: rota post para cadastrar evento
app.post('/addEvento', (request, response) => {
    let nomeEvento = request.body.nomeEvento;
    let local = request.body.local;
    let dataEvento = request.body.dataEvento;
    let horario = request.body.horario;
    console.log(nomeEvento + ' -- ' + local + ' -- ' + dataEvento + ' -- ' + horario);
})

// 06: rota post para Evento Cadastrado 
app.post("/cadastrado", (request,response) => {
    response.render('cadastroEvento.handlebars')
   

    let nomeE = request.body.nomeEvento;
    let localE = request.body.localEvento;
    let dataE = request.body.dataEvento;
    let horaE = request.body.horaEvento; 
    

        new novoEvento({
            nome: nomeE,
            local: localE,
            data: dataE,
            horario: horaE
        }).save().then(() => {
            
            console.log("Evento cadastrado")
            response.redirect("buscarEvento")
        }).catch((err) => {
            console.log("Erro ao adicionar evento" +err)
        })
    
});

// 07: rota get para login
app.get('/login', (request, response) => {
    response.render('login.handlebars')
});
// 08: rota post para login 
app.post('/login', (request, response) => {
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
      
        
    })(request, response)
});

// 09: rota get para buscar evento
app.get('/buscarEvento', (request,response) => {
   novoEvento.find().lean().then((eventos) =>{
        response.render('buscarEvento.handlebars', {eventos:eventos})
    }).catch((err) =>{
        console.log("Erro ao listar eventos")
    })
    
});

// 10: rota post para buscar evento
app.post('/buscarEvento', (request, response) => {
    let nomeEvento = request.body.nomeEvento;
    novoEvento.findOne({nome: nomeEvento}).lean().then((evento)=>{
        response.render('buscarEvento.handlebars', {evento:evento})
    })
    
});

// 11: rota para Editar Evento
app.get('/editarEvento:id', (request, response) =>{
    novoEvento.findOne({_id:request.params.id}).lean().then((eventos) =>{
        response.render('editarEvento.handlebars', {eventos: eventos})
    }).catch((err) =>{
        response.redirect("/buscarEvento")
    })  
})

// 12: rota para Evento editado
app.post('/eventoEditado', (request, response) =>{
    novoEvento.findOne({_id: request.body.id}).then((eventos) =>{
        eventos.nome = request.body.nomeEvento
        eventos.local = request.body.localEvento
        eventos.data = request.body.dataEvento
        eventos.horario = request.body.horarioEvento

        eventos.save().then(() =>{
            console.log("Evento Editado Salvo")
            response.redirect("/buscarEvento")
        }).catch((err) =>{
            console.log("Erro ao salvar a evento editado")
        })
    }).catch((err) =>{
        console.log("Erro ao editar o evento ")
        response.redirect("/buscarEvento")
    })
})

// 13: rota para Deletar Evento
app.get('/deletarEvento:id', (request, response) =>{
    novoEvento.findOneAndDelete({_id: request.params.id}).then(() =>{
        response.redirect("/buscarEvento")
    }).catch((err) =>{
        response.redirect("/buscarEvento")
    })
})

// servidor
app.listen(portaHttp, () => {
    console.log('servidor funcionando em: ' + portaHttp)
});