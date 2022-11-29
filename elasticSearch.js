let client;

module.exports = {
  async save(index, id, text) {
    console.log('ES save', index, id);
    if (!text) {
      console.log('tried to save null document to index', index, id);
      return undefined;
    }
    if (client) {
      try {
        // use await here so we can catch and handle errors here
        const r = await client.index({
          id,
          index,
          refresh: true,
          body: text,
        });
        return r;
      } catch (e) {
        try {
          console.log('ES save error', index, id);
          const reason = e.Object.assign({}, ...e.split(', ').filter((s) => s.startsWith('queue')).map((s) => {
            const [k, v] = s.split(' = '); return { [k]: v };
          }));
          if (reason['queued tasks'] && reason['queue capacity']) {
            if (reason['queued tasks'] === reason['queue capacity']) {
              console.log('ES database indexing queue is full');
            }
            return 'ES Busy';
          }
        } catch (e1) {
          console.log('we caught the ES exception but did not recognise it', JSON.stringify(e1));
        }
      }
    } else {
      console.log('no ES client set');
    }
    return undefined;
  },
  async find(index, query) {
    // console.log('ES find', index, query);
    if (client) {
      // console.log('ES have client');
      try {
        // use await here so we can catch and handle errors here
        const r = await client.search({
          index,
          body: query,
        });
        // console.log('ES returned', r);
        return r.body;
      } catch (e) {
        console.log('ES get error', index, query, JSON.stringify(e));
      }
    } else {
      console.log('no ES client set');
    }
    return undefined;
  },
  async getMissing(index, list) {
    // console.log('es get missing', index, list);
    const field = `pips.${index}.pid`;
    const query = {
      query: {
        terms: { [field]: list },
      },
      _source: field,
    };
    if (client) {
      try {
        const r = await client.search({
          index,
          body: query,
        });
        const l = [];
        if (r.hits.total > 0) {
          r.hits.hits.forEach((hit) => {
            // eslint-disable-next-line no-underscore-dangle
            l.push(hit._source.pips[index].pid);
          });
        }
        return list.filter((val) => !l.includes(val));
      } catch (e) {
        console.log('error in ES', JSON.stringify(e));
      }
    }
    return list; // then all will be refreshed
  },
  settings(esclient) {
    client = esclient;
  },
};
