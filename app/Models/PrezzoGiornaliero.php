<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrezzoGiornaliero extends Model
{
    protected $table = 'prezzi_giornalieri';
    public $timestamps = false;

    protected $fillable = [
        'symbol', 'nome', 'data', 'prezzo_chiusura', 
        'prezzo_apertura', 'massimo', 'minimo', 'variazione_pct', 'volume'
    ];
}