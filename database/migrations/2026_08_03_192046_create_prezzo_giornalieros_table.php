<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
Schema::create('prezzi_giornalieri', function (Blueprint $table) {
    $table->id();
    $table->string('symbol');
    $table->string('nome');
    $table->date('data');
    
    // 8 cifre totali, 2 cifre decimali (es. 123456.78)
    $table->decimal('prezzo_chiusura', 10, 2);
    $table->decimal('prezzo_apertura', 10, 2)->nullable();
    $table->decimal('massimo', 10, 2)->nullable();
    $table->decimal('minimo', 10, 2)->nullable();
    $table->decimal('variazione_pct', 8, 2)->nullable();
    $table->bigInteger('volume')->nullable();
    
    $table->timestamps();
    $table->unique(['symbol', 'data']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prezzo_giornalieros');
    }
};
