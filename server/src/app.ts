import express from 'express';
import { StatusCodes } from 'http-status-codes';
import cors from 'cors';
import PlaylistTrack from './models/playlistTrack';
import { init } from './db';
import { Datastore } from './db'

require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());

app.locals = init();


app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`);
});

app.get('/api/playlists', (req, res) => {
    res.send((<Datastore>req.app.locals).playlists.find())
});
app.post("/api/track", (req, res) => {
    if (!req.body.playlistId || !req.body.trackId) {
        res.status(StatusCodes.BAD_REQUEST).send("Mandatory fields missing");
    }
    else {
        const store = <Datastore>req.app.locals;
        let track = store.playlistTracks.find({ 'playlistId': req.body.playlistId, 'trackId': req.body.trackId })
        if (track.length != 0) {
            res.status(StatusCodes.FORBIDDEN).send('Song is already in this list')
        } else {
            const newPlaylistTrack: PlaylistTrack = {
                playlistId: req.body.playlistId,
                trackId: req.body.trackId,
            };
            store.playlistTracks.insert(newPlaylistTrack)
            res.status(StatusCodes.CREATED).header({ Location: `${req.path}/${req.body.id}` }).send(newPlaylistTrack)
        }
    }
});
app.delete('/api/track*', (req, res) => {
    const playListId = Number(req.query.playlistid);
    const trackId = Number(req.query.trackid);

    if (playListId || trackId) {
        const store = <Datastore>req.app.locals;
        const trackToDelete = store.playlistTracks.find({ '$and': [{ 'playlistId': playListId }, { 'trackId': trackId }] });
        if (trackToDelete) {
            store.playlistTracks.remove(trackToDelete);
            res.status(StatusCodes.NO_CONTENT).send();
        } else {
            res.status(StatusCodes.NOT_FOUND).send();
        }
    } else {
        res.status(StatusCodes.BAD_REQUEST).send('Parameter id must be a number');
    }
})
app.get('/api/genres', (req, res) => {
    res.send((<Datastore>req.app.locals).genres.find())
})
app.get('/api/albums', (req, res) => {
    res.send((<Datastore>req.app.locals).albums.find())
});
app.get('/api/tracks*', (req, res) => {
    const genreId = Number(req.query.genreId);
    if (req.query.genreId != undefined) {
        const store = <Datastore>req.app.locals;
        const genreToSearch = store.genres.find({ 'genreId': genreId })
        if (genreToSearch) {
            res.status(StatusCodes.OK).send(store.tracks.find({ 'genreId': genreId }))
        } else {
            res.status(StatusCodes.NOT_FOUND).send(`Genre with id ${genreId} was not found`)
        }
    } else {
        res.status(StatusCodes.BAD_REQUEST).send(`Cannot work with the given query parameter`)
    }
});
app.get('/api/playlisttracks/:id', (req, res) => {

    const id = parseInt(req.params.id);
    if (id) {
        const store = <Datastore>req.app.locals;
        const playlisttracks = store.playlistTracks.find({ 'playlistId': id })
        const tracks = store.tracks.find();

        if (playlisttracks) {
            res.send(playlisttracks.filter(x => x.playlistId === id)
                .map(x => tracks.find(y => y.trackId === x.trackId)).sort((first: any, second: any) => first.trackName.localeCompare(second.trackName)));
        } else {
            res.status(StatusCodes.NOT_FOUND).send();
        }
    } else {
        res.status(StatusCodes.BAD_REQUEST).send('Parameter id must be a number');
    }
});