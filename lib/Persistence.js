/* << Copyright 2022 Iñigo Tamayo Uria, Ana Domínguez Fanlo, Mikel Joseba Zorrilla Berasategui, Héctor Rivas Pagador, Sergio Cabrero Barros, Juan Felipe Mogollón Rodríguez and Stefano Masneri >>
This file is part of OrkestraServer.
OrkestraServer is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
OrkestraServer is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
You should have received a copy of the GNU Lesser General Public License along with Orkestralib. If not, see <https://www.gnu.org/licenses/>. */
var persistency = function(app,db){
  app.post("/saveShow",(request,response)=>{

    var data = request.body;
    db.updateShow(data.name,data.show);
    response.send ('{"result":"ok"}');
  });
  app.get("/getShows",(request,response)=>{

    db.getShows((e)=>{
	  response.send (JSON.stringify(e));

	});
  });
  app.post("/removeShow",(request,response)=>{
    var data = request.body;
    db.removeShow(data.name);
    response.send ('ok');

  });

}
module.exports = persistency;

