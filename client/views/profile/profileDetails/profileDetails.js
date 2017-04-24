/**
 * @isMethod true
 * @memberOf Method
 * @function onCreated
 * @summary metodo con el cual llamamos a la base de datos para  que nos cree los detalles del perfil
 * @locus profileDetails
 * @param {Object} [username] nombre del usuario creado.
 */
Template.profileDetails.onCreated(function(){
    var self = this;
    var username = Router.current().params.username;
    self.autorun(function(){
        username = Router.current().params.username;
        self.subscribe("userData", username, {
            onReady:function(){
                var user = Meteor.users.findOne({username: username});
                self.subscribe("userFriendCount", user._id);
                self.subscribe("userNewFriends", user._id);
            }
        });
    })
    /**
     * @isMethod true
     * @memberOf Method
     * @function autorun
     * @summary mmetodo que iniciara el perfil del usuario
     * @locus profileDetails
     * @param {Object} [user] usuario devuelto de la base de datos
     */
    self.autorun(function(){
        if(Template.instance().subscriptionsReady()) {
            var user = Meteor.users.findOne({username: username});
            if(!user) {
                Router.go("/");
            }
        }
    })

})

Template.profileDetails.helpers({
    /**
     * @isMethod true
     * @memberOf Method
     * @function fullname
     * @summary funcion que nos da el nombre completo del usuario
     * @locus profileDetails
     * @param {Object} [fullname] nombre completo del usuario con firstname + lastname
     * @param {Object} [username] nombre del usuario.
     */
    fullname:function(){
        var username = Router.current().params.username;
        var user = Meteor.users.findOne({username:username});
        return user ? user.profile.name.first + " " + user.profile.name.last : null;
    },
    /**
     * @isMethod true
     * @memberOf Method
     * @function profilePicture
     * @summary funcion para conseguir la foto de perfil
     * @locus profileDetails
     * @param {Object} [username] nombre del usuario
     * @param {Object} [user] imagen de perfil
     */
    profilePicture:function() {
        var username = Router.current().params.username;
        var user = Meteor.users.findOne({username:username});
        return user ? user.profile.picture.large : null;
    },
    /**
     * @isMethod true
     * @memberOf Method
     * @function friendCount
     * @summary funcion que nos dara los amigos del usuario
     * @locus profileDetails
     * @param {Object} [count] cuenta de los amigos
     * @param {Object} [username] nombre del usuario
     */
    friendCount:function(){
        var username = Router.current().params.username;
        var user = Meteor.users.findOne({username:username});
        if(user) {
            var count = Counts.findOne({_id: user._id});
        }
        return count ? count.count : 0;
    },
    /**
     * @isMethod true
     * @memberOf Method
     * @function newFriends
     * @summary funcion que nos dara los ultimos amigos del usuario
     * @locus profileDetails
     * @param {Object} [user] usuario completo devuelto de la base de datos
     * @param {Object} [username] nombre del usuario
     * @param {userArr} array de los amigos del usuario
     */
    newFriends:function(){
        var username = Router.current().params.username;
        var user = Meteor.users.findOne({username:username});
        var userArr = [];
        if(user){
            var edges = UserEdges.find({$or: [{requester: user._id},{requestee: user._id}], status:"accepted"}).fetch();
            var friendEdges = _.filter(edges, function(edge){
                if(edge.requester === user._id || edge.requestee === user._id) {
                    if(edge.requester !== user._id) {
                        userArr.push(edge.requester)
                    } else {
                        userArr.push(edge.requestee);
                    }
                }
            })
            return user ? Meteor.users.find({_id: {$in: userArr}}) : [];
        }

    },
    /**
     * @isMethod true
     * @memberOf Method
     * @function about
     * @summary funcion que nos dara los detalles sobre el usuario
     * @locus profileDetails
     * @param {Object} [user] usuario devuelto de la base de datos
     * @param {Object} [username] nombre del usuario
     */
    about:function(){
        var username = Router.current().params.username;
        var user = Meteor.users.findOne({username:username});
                return user ? user.profile.location.street + " " +
                              user.profile.location.city + ", " + user.profile.location.state + " " + user.profile.location.zip : "";
    },
    /**
     * @isMethod true
     * @memberOf Method
     * @function ownerProfileDetails
     * @summary funcion que nos dara los detalles del perfil
     * @locus profileDetails
     * @param {Object} [user._id] id del usuario con la que nos devolveran los detalles
     * @param {Object} [username] nombre del usuario
     */
    ownerProfileDetails: function(){
      var username = Router.current().params.username;
      var user = Meteor.users.findOne({username:username});

      return user._id === Meteor.userId();
    },
    /**
     * @isMethod true
     * @memberOf Method
     * @function friendAdded
     * @summary funcion que nos devolvera si hemos agregado al usuario como amigo
     * @locus profileDetails
     * @param {Object} [edge] peticion de amistad
     * @param {Object} [username] nombre del usuario
     */
    friendAdded:function() {
        var username = Router.current().params.username;
        var user = Meteor.users.findOne({username:username});
        var edge = UserEdges.find({$or: [{requester: user._id},{requestee: user._id}], status:"accepted"}).fetch();

        if (edge[0].requester === user._id || edge[0].requestee === user._id) {
          return true;
        } else {
          return false;
        }
    },
    /**
     * @isMethod true
     * @memberOf Method
     * @function requestedFriend
     * @summary funcion que nos dira si hemos enviado petición al usuario
     * @locus profileDetails
     * @param {Object} [edge] petición de amistad
     * @param {Object} [username] nombre del usuario
     */
    requestedFriend:function() {
        var username = Router.current().params.username;
        var user = Meteor.users.findOne({username:username});
        var edge = UserEdges.find({$or: [{requester:  Meteor.userId()},{requestee:  Meteor.userId()}], status:"accepted"}).fetch();
        console.log("user", user);
        console.log("edge",edge);
        if (edge[0].requestee === user._id) {

          return true;
        } else {
          console.log("adios");
          return false;
        }
    }
})


Template.profileDetails.events({
    /**
     * @isMethod true
     * @memberOf Method
     * @function .click .add-friend
     * @summary funcion de click on la que se envia la petición de amistad
     * @locus profileDetails
     * @param {Object} [requester._id] usuario que envia la petición de amistad
          * @param {Object} [requestee._id] usuario que recibira la petición de amistad
     * @param {Object} [username] nombre del usuario
     */
    'click .add-friend':function(){
        var profileUser = Router.current().params.username;
        var requester = Meteor.user();
        var requestee = Meteor.users.findOne({username:profileUser});
        if(requester._id !== requestee._id){
            Meteor.call("addFriend",requester._id, requestee._id, function(err,res){
            });
        }

    }
})
